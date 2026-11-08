import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 192,
  height: 192,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 84,
          background: 'linear-gradient(135deg, #042f2e 0%, #0d9488 50%, #059669 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          borderRadius: '38px',
          fontWeight: 900,
          border: '6px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          fontFamily: 'sans-serif',
          letterSpacing: '-2px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span>E</span>
          <span style={{ color: '#fbbf24' }}>X</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
