import { useCallback, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import BottomNav from '@features/user/components/BottomNav';
import { Scan as ScanIcon } from 'lucide-react';

import { useAuthUser } from '@features/user/hooks/useAuthUser';
import { supabase } from '@shared/services/supabase';

const qrcodeRegionId = 'qr-reader';

const Scan = () => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processedRef = useRef(false);
  const { user } = useAuthUser();

  const handleSuccessfulScan = useCallback(
    async (decodedText: string) => {
      if (processedRef.current) return; // hindari insert ganda saat kamera masih aktif
      processedRef.current = true;

      const raw = decodedText.trim();
      let id = raw;

      // 1) Coba parse sebagai URL
      try {
        const url = new URL(raw);
        const segments = url.pathname.split('/').filter(Boolean);
        // contoh: /detail/a2f7b1d9-5c41-42c1-92f2-7b1ad3e10e55
        id = segments[segments.length - 1]; // ambil UUID-nya
      } catch {
        // 2) Kalau bukan URL tapi masih mengandung '/', ambil bagian terakhir juga
        const parts = raw.split('/').filter(Boolean);
        id = parts[parts.length - 1];
      }

      // OPTIONAL: kalau QR berisi encoded value
      id = decodeURIComponent(id);

      // Matikan kamera lebih dulu supaya callback tidak terpicu lagi
      try {
        await scannerRef.current?.stop();
        await scannerRef.current?.clear();
      } catch {
        // ignore
      }

      // Simpan riwayat scan (sekarang id = UUID, cocok dengan data_pohon.id)
      try {
        const { error } = await supabase.from('scan').insert({
          data_pohon_id: id,    // kolom ini pasti tipe uuid → OK
          user_id: user?.id ?? null,
        });

        if (error) {
          console.error('Supabase insert error:', error.message);
        }
      } catch (error) {
        console.error('Gagal menyimpan scan', error);
      }

      // Arahkan ke halaman detail dengan ID yang sudah bersih
      window.location.href = `/detail/${encodeURIComponent(id)}`;
    },
    [user?.id]
  );


  useEffect(() => {
    const html5Qrcode = new Html5Qrcode(qrcodeRegionId);
    const applyFullSizeVideo = () => {
      const root = document.getElementById(qrcodeRegionId);
      if (!root) return;
      root.style.width = '100%';
      root.style.height = '100%';
      const scanRegion = root.querySelector<HTMLElement>('#qr-reader__scan_region');
      if (scanRegion) {
        scanRegion.style.width = '100%';
        scanRegion.style.height = '100%';
        scanRegion.style.display = 'flex';
        scanRegion.style.alignItems = 'center';
        scanRegion.style.justifyContent = 'center';
      }
      const video = root.querySelector<HTMLVideoElement>('video');
      if (video) {
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
      }
    };

    html5Qrcode
      .start({ facingMode: 'environment' }, { fps: 10, aspectRatio: 1.777778 }, handleSuccessfulScan, () => {})
      .then(() => {
        scannerRef.current = html5Qrcode;
        applyFullSizeVideo();
        window.addEventListener('resize', applyFullSizeVideo);
      })
      .catch((err) => console.error('Kamera gagal dibuka', err));

    return () => {
      window.removeEventListener('resize', applyFullSizeVideo);
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, [handleSuccessfulScan]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <div className='absolute z-30 left-1/2 top-1/5 -translate-y-1/2 -translate-x-1/2'>
        <span className='py-3 px-6 rounded-xl text-md font-medium bg-black/40 text-white '>Scan Tree QR Code</span>
      </div>
      <ScanIcon strokeWidth={0.5} className="absolute z-30 top-1/2 left-1/2 h-80 w-80 animate-pulse -translate-x-1/2 -translate-y-1/2 text-white" />
      <div id={qrcodeRegionId} className="absolute inset-0 h-full w-full" />
      <BottomNav />
    </div>
  );
};

export default Scan;
