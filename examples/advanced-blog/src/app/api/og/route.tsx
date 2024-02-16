import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

const font = fetch(
  new URL("../../../../fonts/Inter-SemiBold.ttf", import.meta.url)
).then((res) => res.arrayBuffer());

export async function GET(request: Request) {
  const fontData = await font;

  try {
    const { searchParams } = new URL(request.url);

    // ?title=<title>
    const hasTitle = searchParams.has("title");
    const title = hasTitle ? searchParams.get("title") : "My Outstatic Site";

    // ?siteUrl=<siteUrl>
    const hasSiteUrl = searchParams.has("siteUrl");
    const siteUrl = hasSiteUrl ? searchParams.get("siteUrl") : "outstatic.com";

    // Built using satori (https://github.com/vercel/satori)
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            letterSpacing: "-.02em",
            fontWeight: 700,
            background: "white",
            color: "black",
          }}
        >
          <div
            style={{
              display: "flex",
              position: "absolute",
              maxWidth: "100%",
            }}
          >
            <svg
              width="1200"
              height="631"
              viewBox="0 0 1200 631"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_481_12)">
                <g clip-path="url(#clip1_481_12)">
                  <rect
                    width="1200"
                    height="630"
                    transform="translate(0 0.695312)"
                    fill="white"
                  />
                  <path
                    d="M-220.122 423.117C-178.8 396.191 -141.628 363.078 -100.257 336.12C-75.9935 320.31 -53.007 301.879 -25.2602 291.697C3.95805 280.975 37.614 269.965 75.5643 277.371C102.111 282.552 128.835 292.145 158.567 313.927C181.959 331.064 197.337 352.818 215.553 380.773C248.194 430.867 253.134 483.48 252.008 523.73C250.674 571.423 227.394 595.094 189.809 593.897C154.377 592.769 108.156 574.997 82.7217 509.314C48.4463 420.799 145.015 423.828 181.065 423.251C262.276 421.951 356.043 447.503 448.547 478.649C555.887 514.79 653.916 589.557 775.459 607.698C920.038 643.45 1204.77 584.406 1207.08 339.556"
                    stroke="black"
                    stroke-width="2.82749"
                    stroke-linecap="round"
                  />
                </g>
              </g>
              <defs>
                <clipPath id="clip0_481_12">
                  <rect
                    width="1200"
                    height="630"
                    fill="white"
                    transform="translate(0 0.695312)"
                  />
                </clipPath>
                <clipPath id="clip1_481_12">
                  <rect
                    width="1200"
                    height="630"
                    fill="white"
                    transform="translate(0 0.695312)"
                  />
                </clipPath>
              </defs>
            </svg>
          </div>
          <div
            style={{
              left: 42,
              top: 42,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              borderRadius: "100%",
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                background: "black",
                borderRadius: 100,
              }}
            />
            <span
              style={{
                marginLeft: 8,
                fontSize: 20,
              }}
            >
              {siteUrl}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              padding: "20px 50px",
              margin: "0 42px",
              fontSize: 40,
              width: "auto",
              maxWidth: 630,
              textAlign: "center",
              backgroundColor: "black",
              color: "white",
              lineHeight: 1.4,
              fontFamily: '"Inter"',
              border: "3px solid black",
              borderRadius: 8,
            }}
          >
            {title}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Inter",
            data: fontData,
            style: "normal",
          },
        ],
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
