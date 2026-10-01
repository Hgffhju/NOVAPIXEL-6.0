import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { db, auth, googleProvider } from '../lib/firebase';
import { CanvasComment } from '../types';

export interface CloudProject {
  id: string;
  name: string;
  width: number;
  height: number;
  bitDepth: number;
  colorProfile: string;
  linearLight: boolean;
  layersCount: number;
  updatedAt: number;
  previewThumbnail?: string;
  ownerId?: string;
}

// Real-time canvas comments subscription
export function subscribeToSessionComments(
  sessionId: string,
  onUpdate: (comments: CanvasComment[]) => void
) {
  const commentsRef = collection(db, 'collabSessions', sessionId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const comments: CanvasComment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        comments.push({
          id: docSnap.id,
          userId: data.userId || 'anon',
          userName: data.userName || 'Artist',
          userAvatar: data.userAvatar || '',
          x: data.x || 0,
          y: data.y || 0,
          text: data.text || '',
          resolved: !!data.resolved,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
        });
      });
      onUpdate(comments);
    },
    (error) => {
      console.warn('Firestore comments snapshot notice:', error.message);
    }
  );
}

// Add comment pin to Firestore
export async function addCommentToCloud(
  sessionId: string,
  comment: Omit<CanvasComment, 'id'>
): Promise<string> {
  const commentId = 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const commentRef = doc(db, 'collabSessions', sessionId, 'comments', commentId);

  await setDoc(commentRef, {
    ...comment,
    createdAt: Date.now(),
  });

  return commentId;
}

// Toggle resolved status of a comment pin
export async function toggleCommentResolution(
  sessionId: string,
  commentId: string,
  newResolvedState: boolean
) {
  const commentRef = doc(db, 'collabSessions', sessionId, 'comments', commentId);
  await updateDoc(commentRef, {
    resolved: newResolvedState,
    updatedAt: Date.now(),
  });
}

// Save project metadata to Firestore
export async function saveProjectToFirestore(
  project: CloudProject
) {
  const projectRef = doc(db, 'projects', project.id);
  await setDoc(
    projectRef,
    {
      title: project.name,
      width: project.width,
      height: project.height,
      bitDepth: project.bitDepth,
      colorProfile: project.colorProfile,
      linearLight: project.linearLight,
      ownerId: auth.currentUser?.uid || 'guest-artist',
      layersCount: project.layersCount || 1,
      previewThumbnail: project.previewThumbnail || '',
      updatedAt: Date.now(),
      createdAt: Date.now(),
    },
    { merge: true }
  );
}

// Fetch all cloud projects from Firestore
export async function fetchCloudProjects(): Promise<CloudProject[]> {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    const list: CloudProject[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      list.push({
        id: docSnap.id,
        name: d.title || 'Untitled Project',
        width: d.width || 1920,
        height: d.height || 1080,
        bitDepth: d.bitDepth || 16,
        colorProfile: d.colorProfile || 'Display P3',
        linearLight: !!d.linearLight,
        layersCount: d.layersCount || 1,
        previewThumbnail: d.previewThumbnail || '',
        ownerId: d.ownerId,
        updatedAt: d.updatedAt || Date.now(),
      });
    });
    return list;
  } catch (e) {
    console.warn('Error fetching cloud projects:', e);
    return [];
  }
}

// Delete cloud project
export async function deleteProjectFromFirestore(projectId: string) {
  await deleteDoc(doc(db, 'projects', projectId));
}

// Live peer presence and cursor synchronization
let lastBroadcast = 0;
export async function broadcastUserCursor(
  sessionId: string,
  userId: string,
  userName: string,
  color: string,
  avatar: string,
  cursor: { x: number; y: number; activeTool: string }
) {
  const now = Date.now();
  // Throttle updates to ~120ms to save bandwidth while keeping cursor smooth
  if (now - lastBroadcast < 120) return;
  lastBroadcast = now;

  try {
    const userRef = doc(db, 'collabSessions', sessionId, 'collaborators', userId);
    await setDoc(
      userRef,
      {
        id: userId,
        name: userName,
        color,
        avatar,
        cursor,
        lastSeen: now,
      },
      { merge: true }
    );
  } catch (err) {
    // Ignore transient network errors
  }
}

// Subscribe to real-time peer presence in Firestore
export function subscribeToCollaboratorPresence(
  sessionId: string,
  currentUserId: string,
  onUpdate: (collaborators: any[]) => void
) {
  const colRef = collection(db, 'collabSessions', sessionId, 'collaborators');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const peers: any[] = [];
      const threshold = Date.now() - 30000; // active within last 30s
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.id !== currentUserId && (d.lastSeen || 0) > threshold) {
          peers.push(d);
        }
      });
      onUpdate(peers);
    },
    (err) => {
      console.warn('Presence sync notice:', err.message);
    }
  );
}

// Auth Helpers
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In error:', error);
    return null;
  }
}

export async function loginAnonymously(): Promise<User | null> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    return null;
  }
}

export async function logoutUser() {
  await firebaseSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
