import React from "react";

import wallpaper1 from "./wallpapers/wallpaper-1.png";
import wallpaper2 from "./wallpapers/wallpaper-2.png";
import wallpaper3 from "./wallpapers/wallpaper-3.png";
import wallpaper4 from "./wallpapers/wallpaper-4.png";
import wallpaper5 from "./wallpapers/wallpaper-5.png";
import wallpaper6 from "./wallpapers/wallpaper-6.png";
import wallpaper7 from "./wallpapers/wallpaper-7.png";
import wallpaper8 from "./wallpapers/wallpaper-8.png";
import template from "./template.png";

import ScreenshotIcon from "./ScreenshotIcon.svg?component";

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

  // with shadows
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

const wallpapers = [
  wallpaper1,
  wallpaper2,
  wallpaper3,
  wallpaper4,
  wallpaper5,
  wallpaper6,
  wallpaper7,
  wallpaper8,
];

const createRaycastScreenshot = async (
  ctx: CanvasRenderingContext2D,
  wallpaper: string,
  screenshot: HTMLImageElement,
  composition: GlobalCompositeOperation = "overlay"
) => {
  const wallpaperImage = await loadImage(wallpaper);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const image = { width: 2000, height: 1250 };

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  const screenshotRatio = screenshot.width / screenshot.height;
  const spacings = ratios[screenshotRatio as keyof typeof ratios];
  console.log(" >>> RATIO", screenshotRatio);

  if (spacings) {
    image.width = 2000;
    image.height = 1250;
  } else {
    image.width = screenshot.width + 500;
    image.height = screenshot.height + 300;
  }

  ctx.canvas.width = image.width;
  ctx.canvas.height = image.height;

  ctx.drawImage(
    wallpaperImage,
    -100,
    -100,
    image.width + 200,
    image.height + 200
  );

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
    );
  } else {
    ctx.drawImage(screenshot, 250, 150, image.width - 500, image.height - 300);
    console.warn(
      "Image size is not supported, drawing with 250px and 150px offset"
    );
  }

  ctx.globalCompositeOperation = composition;
  ctx.globalAlpha = 0.5;

  ctx.drawImage(wallpaperImage, 0, 0, image.width, image.height);

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
  const debug = React.useMemo(() => {
    return window.location.search === "?debug";
  }, []);
  const [composition, setComposition] =
    React.useState<GlobalCompositeOperation>("overlay");
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
          screenshot,
          composition
        );
        images.push(url);
      }
      setResults(images);
    })();
  }, [ctx, screenshots, selectedWallpaper, composition]);

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
          <ScreenshotIcon style={{ marginBottom: 18 }} />
          <span style={{ fontSize: 18 }}>Select Raycast screenshot</span>
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
      {debug && (
        <select
          value={composition}
          onChange={(e) =>
            setComposition(e.target.value as GlobalCompositeOperation)
          }
        >
          <option value="color">color</option>
          <option value="color-burn">color-burn</option>
          <option value="color-dodge">color-dodge</option>
          <option value="copy">copy</option>
          <option value="darken">darken</option>
          <option value="destination-atop">destination-atop</option>
          <option value="destination-in">destination-in</option>
          <option value="destination-out">destination-out</option>
          <option value="destination-over">destination-over</option>
          <option value="difference">difference</option>
          <option value="exclusion">exclusion</option>
          <option value="hard-light">hard-light</option>
          <option value="hue">hue</option>
          <option value="lighten">lighten</option>
          <option value="lighter">lighter</option>
          <option value="luminosity">luminosity</option>
          <option value="multiply">multiply</option>
          <option value="overlay">overlay</option>
          <option value="saturation">saturation</option>
          <option value="screen">screen</option>
          <option value="soft-light">soft-light</option>
          <option value="source-atop">source-atop</option>
          <option value="source-in">source-in</option>
          <option value="source-out">source-out</option>
          <option value="source-over">source-over</option>
          <option value="xor">xor</option>
        </select>
      )}
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
          gridTemplateColumns: "1fr",
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
