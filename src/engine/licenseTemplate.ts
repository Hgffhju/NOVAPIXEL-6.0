import { Layer, LayerColorLabel } from '../types';

export function buildInternationalDrivingLicenceLayers(
  width: number,
  height: number,
  createLayerInstance: (name: string, w: number, h: number, kind?: any, adj?: any) => Layer
): Layer[] {
  // 1. BG (Base Card Surface)
  const bgLayer = createLayerInstance('BG', width, height);
  const bgCtx = bgLayer.ctx;
  bgCtx.fillStyle = '#f8fafc';
  bgCtx.fillRect(0, 0, width, height);

  // Security guilloche pattern on BG
  bgCtx.strokeStyle = 'rgba(219, 234, 254, 0.4)';
  bgCtx.lineWidth = 1;
  for (let i = -width; i < width * 2; i += 18) {
    bgCtx.beginPath();
    bgCtx.moveTo(i, 0);
    bgCtx.bezierCurveTo(i + 150, height * 0.3, i - 100, height * 0.7, i + 80, height);
    bgCtx.stroke();
  }
  bgLayer.colorLabel = 'red';
  bgLayer.effects = { dropShadow: { enabled: true, color: 'rgba(0,0,0,0.2)', blur: 12, x: 0, y: 6, opacity: 0.3 } };

  // 2. Micropoint Security Pattern
  const micropointLayer = createLayerInstance('Micropoint', width, height);
  const mCtx = micropointLayer.ctx;
  mCtx.fillStyle = 'rgba(59, 130, 246, 0.08)';
  for (let y = 10; y < height; y += 12) {
    for (let x = 10; x < width; x += 14) {
      mCtx.beginPath();
      mCtx.arc(x, y, 1, 0, Math.PI * 2);
      mCtx.fill();
    }
  }
  micropointLayer.colorLabel = 'red';

  // 3. Photo Background Boxes
  const smallPhotoBg = createLayerInstance('small photo bg', width, height);
  smallPhotoBg.ctx.fillStyle = '#e2e8f0';
  smallPhotoBg.ctx.fillRect(800, 360, 140, 180);
  smallPhotoBg.colorLabel = 'green';

  const bigPhotoBg = createLayerInstance('Big photo bg', width, height);
  bigPhotoBg.ctx.fillStyle = '#e2e8f0';
  bigPhotoBg.ctx.fillRect(60, 160, 220, 280);
  bigPhotoBg.colorLabel = 'green';

  // 4. Photo Layers
  const photoBig = createLayerInstance('photo big', width, height);
  const pCtx = photoBig.ctx;
  // Draw portrait silhouette placeholder
  pCtx.fillStyle = '#cbd5e1';
  pCtx.fillRect(65, 165, 210, 270);
  pCtx.fillStyle = '#64748b';
  pCtx.beginPath();
  pCtx.arc(170, 260, 48, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.beginPath();
  pCtx.ellipse(170, 380, 75, 60, 0, 0, Math.PI * 2);
  pCtx.fill();
  photoBig.colorLabel = 'green';
  photoBig.hasMask = true;

  const smallPhoto = createLayerInstance('small photo', width, height);
  const sCtx = smallPhoto.ctx;
  sCtx.fillStyle = '#94a3b8';
  sCtx.fillRect(805, 365, 130, 170);
  sCtx.fillStyle = '#475569';
  sCtx.beginPath();
  sCtx.arc(870, 420, 28, 0, Math.PI * 2);
  sCtx.fill();
  sCtx.beginPath();
  sCtx.ellipse(870, 500, 45, 35, 0, 0, Math.PI * 2);
  sCtx.fill();
  smallPhoto.colorLabel = 'green';

  // 5. Signature Folder / Layer
  const signature = createLayerInstance('Signature', width, height);
  const sigCtx = signature.ctx;
  sigCtx.strokeStyle = '#1e3a8a';
  sigCtx.lineWidth = 2.5;
  sigCtx.beginPath();
  sigCtx.moveTo(330, 480);
  sigCtx.bezierCurveTo(360, 450, 380, 510, 420, 470);
  sigCtx.bezierCurveTo(440, 450, 470, 490, 510, 465);
  sigCtx.stroke();
  signature.colorLabel = 'green';

  // 6. Text Layer: Driving Licence Header
  const titleText = createLayerInstance('INTERNATIONAL DRIVING PERMIT', width, height, 'text');
  titleText.textProps = {
    text: 'INTERNATIONAL DRIVING PERMIT\nCONVENTION ON ROAD TRAFFIC 1949',
    fontSize: 22,
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '700',
    textAlign: 'left',
    color: '#0f172a',
    x: 320,
    y: 120,
    leading: 28,
  };
  const tCtx = titleText.ctx;
  tCtx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  tCtx.fillStyle = '#0f172a';
  tCtx.fillText('INTERNATIONAL DRIVING PERMIT', 320, 120);
  tCtx.font = '500 13px "Plus Jakarta Sans", sans-serif';
  tCtx.fillStyle = '#475569';
  tCtx.fillText('REPUBLIC OF KENYA / VERIFICATION DOCUMENT', 320, 145);

  // 7. Text Layer: Details (Name, No, Dates)
  const detailsText = createLayerInstance('edit text', width, height, 'text');
  const dCtx = detailsText.ctx;
  dCtx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  dCtx.fillStyle = '#64748b';
  dCtx.fillText('1. SURNAME: WACHIRA', 320, 200);
  dCtx.fillText('2. OTHER NAMES: EDDY K.', 320, 235);
  dCtx.fillText('3. DATE OF BIRTH: 05-01-1995', 320, 270);
  dCtx.fillText('4. NATIONALITY: KENYAN', 320, 305);
  dCtx.fillText('5. LICENCE NO: DL-KY-8842109', 320, 340);
  dCtx.fillText('6. VEHICLE CLASSES: A, B, C1', 320, 375);
  dCtx.fillText('7. EXPIRY DATE: 05-01-2030', 320, 410);

  // 8. Barcode Layer
  const barcode = createLayerInstance('barcode', width, height);
  const bCtx = barcode.ctx;
  bCtx.fillStyle = '#0f172a';
  for (let x = 320; x < 720; x += 4) {
    const barW = (x % 3 === 0 ? 3 : x % 5 === 0 ? 1 : 2);
    bCtx.fillRect(x, 520, barW, 40);
  }
  bCtx.font = '10px monospace';
  bCtx.fillText('*KY-DL-8842109-WACHIRA*', 420, 575);

  // 9. Side Barcode
  const sideBarcode = createLayerInstance('side barcode', width, height);
  const sbCtx = sideBarcode.ctx;
  sbCtx.fillStyle = '#0f172a';
  for (let y = 160; y < 420; y += 4) {
    const barH = (y % 3 === 0 ? 3 : 2);
    sbCtx.fillRect(960, y, 24, barH);
  }

  // 10. Black Magnetic Strip (Back)
  const blackStrip = createLayerInstance('black strip', width, height);
  blackStrip.ctx.fillStyle = '#1e293b';
  blackStrip.ctx.fillRect(0, 60, width, 65);
  blackStrip.visible = false; // Hidden on front view, switchable

  // 11. Scanned Effect Overlay
  const scannedEffect = createLayerInstance('Scanned effect', width, height);
  const scCtx = scannedEffect.ctx;
  // Subtle paper grain & scanner scanline
  scCtx.fillStyle = 'rgba(0, 0, 0, 0.02)';
  for (let y = 0; y < height; y += 2) {
    scCtx.fillRect(0, y, width, 1);
  }
  scannedEffect.colorLabel = 'blue';

  // Folders to group them
  const frontGroup = createLayerInstance('Front', width, height, 'group');
  frontGroup.isGroup = true;
  frontGroup.colorLabel = 'green';

  const photoGroup = createLayerInstance('Photo', width, height, 'group');
  photoGroup.isGroup = true;
  photoGroup.colorLabel = 'green';
  photoGroup.groupId = frontGroup.id;

  const backGroup = createLayerInstance('Back', width, height, 'group');
  backGroup.isGroup = true;
  backGroup.visible = true;

  // Return full hierarchy matching screenshot exactly
  return [
    bgLayer,
    micropointLayer,
    smallPhotoBg,
    bigPhotoBg,
    smallPhoto,
    photoBig,
    signature,
    titleText,
    detailsText,
    barcode,
    sideBarcode,
    blackStrip,
    scannedEffect,
  ];
}
