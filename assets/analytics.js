// Medir únicamente la web publicada, no las vistas previas locales ni los PDF.
if (location.hostname === 'slides.diegoayala.com' && location.protocol === 'https:') {
  const beacon = document.createElement('script');
  beacon.type = 'module';
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.dataset.cfBeacon = JSON.stringify({token:'f00eddf676f948a2b5bb9d7ea685950b'});
  document.head.append(beacon);
}
