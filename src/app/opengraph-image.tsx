import { ImageResponse } from 'next/og';

export const alt = 'Open Spot — Discover and map skate spots';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f9f9f9',
          color: '#1b1b1b',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: 96,
            flexGrow: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 16,
                height: 16,
                borderRadius: 0,
                backgroundColor: '#000000',
              }}
            />
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                letterSpacing: 4,
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              Open Spot
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              textTransform: 'uppercase',
            }}
          >
            <div style={{ display: 'flex' }}>Discover and map</div>
            <div style={{ display: 'flex' }}>skate spots.</div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              fontWeight: 300,
              marginTop: 40,
              color: '#4c4546',
            }}
          >
            Plazas, DIYs, bowls, ledges, and pools. Bookmarked across sessions.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 32,
            paddingLeft: 96,
            paddingRight: 96,
            fontSize: 18,
            color: '#7e7576',
            letterSpacing: 2,
            textTransform: 'uppercase',
            borderTop: '1px solid #cfc4c5',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 24,
              height: 1,
              backgroundColor: '#7e7576',
            }}
          />
          <div style={{ display: 'flex' }}>
            Open Spot · High-Contrast Directory
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
