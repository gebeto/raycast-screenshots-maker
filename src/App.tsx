import React from "react";

import wallpaper1 from "./wallpaper-1.png";
import wallpaper2 from "./wallpaper-2.png";
import wallpaper3 from "./wallpaper-3.png";
import wallpaper4 from "./wallpaper-4.png";
import template from "./template.png";

const ratios = {
  [1.5822784810126582]: {
    left: 250,
    top: 150,
    bottom: 300,

    width: 0,
    height: 0,
  },
  [1.482213438735178]: {
    left: 250,
    top: 86,
    bottom: 236,

    width: 0,
    height: 0,
  },
  [1.3489208633093526]: {
    left: 250,
    top: 86,
    bottom: 136,

    width: 0,
    height: 0,
  },

  // shadows
  [1.47098976109215]: {
    left: 137,
    top: 77,
    bottom: 0,

    width: 1726,
    height: 1174,
  },

  [1.4271523178807948]: {
    left: 137,
    top: 77,
    bottom: 0,

    width: 1726,
    height: 1210,
  },
};

const wallpapers = [wallpaper1, wallpaper2, wallpaper3, wallpaper4];

const createRaycastScreenshot = async (
  ctx: CanvasRenderingContext2D,
  wallpaper: string,
  screenshot: HTMLImageElement
) => {
  const wallpaperImage = await loadImage(wallpaper);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const image = { width: 2000, height: 1250 };

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  ctx.drawImage(
    wallpaperImage,
    -100,
    -100,
    image.width + 200,
    image.height + 200
  );

  const screenshotRatio = screenshot.width / screenshot.height;
  const spacings = ratios[screenshotRatio as keyof typeof ratios];
  console.log(" >>> RATIO", screenshotRatio);
  if (spacings) {
    const screenshotWidth = spacings.width || image.width - 500;
    const screenshotHeight = spacings.height || image.height - spacings.bottom;

    ctx.drawImage(
      screenshot,
      0,
      0,
      screenshot.width,
      screenshot.height,
      spacings.left,
      spacings.top,
      screenshotWidth,
      screenshotHeight
      // image.width - 500,
      // image.height - spacings.bottom
    );

    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.3;

    ctx.drawImage(wallpaperImage, 0, 0, image.width, image.height);
  } else {
    ctx.font = "100px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("Not supported image size", 10, 200);
  }

  const url = await fetch(ctx.canvas.toDataURL())
    .then((res) => res.blob())
    .then((blob) => URL.createObjectURL(blob));

  return url;
};

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.addEventListener("load", (e) => resolve(image));
    image.src = url;
  });

function App() {
  const [ctx, setCtx] = React.useState<CanvasRenderingContext2D>();
  const [screenshots, setScreenshots] = React.useState<HTMLImageElement[]>([]);
  const [results, setResults] = React.useState<string[]>([]);
  const [selectedWallpaper, setSelectedWallpaper] =
    React.useState<string>(wallpaper1);

  React.useEffect(() => {
    document.addEventListener("dragover", (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    const handleDrop = (e: DragEvent) => {
      e.stopPropagation();
      e.preventDefault();

      handleFilesChange(
        e.dataTransfer?.files ? [...e.dataTransfer?.files] : []
      );
    };

    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  const handleFilesChange = async (files: File[]) => {
    const uploadedScreenshots: HTMLImageElement[] = [];
    for await (const file of files) {
      const fileUrl = URL.createObjectURL(file);
      uploadedScreenshots.push(await loadImage(fileUrl));
    }
    setScreenshots((screenshots) => [...screenshots, ...uploadedScreenshots]);
  };

  React.useEffect(() => {
    if (!ctx) return;
    if (!selectedWallpaper) return;

    (async () => {
      const images: string[] = [];
      for await (const screenshot of screenshots) {
        const url = await createRaycastScreenshot(
          ctx,
          selectedWallpaper,
          screenshot
        );
        images.push(url);
      }
      setResults(images);
    })();
  }, [ctx, screenshots, selectedWallpaper]);

  return (
    <main>
      <canvas
        style={{
          backgroundImage: `url(${template})`,
          backgroundSize: "100% 100%",
          width: "0px",
          height: "0px",
        }}
        ref={(canvas) => setCtx(canvas?.getContext("2d") || undefined)}
        width="2000"
        height="1250"
      ></canvas>
      <div>
        <label className="file-picker" htmlFor="upload-screenshot">
          Select Raycast screenshot
        </label>
        <input
          id="upload-screenshot"
          type="file"
          multiple
          onChange={(e) => {
            const files = e.target.files ? [...e.target.files] : [];
            e.target.value = "";

            handleFilesChange(files);
          }}
        />
      </div>
      <div className="wallpapers">
        {wallpapers.map((wallpaper, index) => (
          <div
            onClick={() => setSelectedWallpaper(wallpaper)}
            key={index}
            data-selected={wallpaper === selectedWallpaper && "1"}
            className="wallpaper"
            style={{ backgroundImage: `url(${wallpaper})` }}
          />
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginTop: "12px",
        }}
      >
        {results.map((res) => (
          <a
            href={res}
            target="_blank"
            key={res}
            style={{ borderRadius: "12px", overflow: "hidden", fontSize: "0" }}
          >
            <img src={res} width="100%" />
          </a>
        ))}
      </div>
    </main>
  );
}

export default App;
