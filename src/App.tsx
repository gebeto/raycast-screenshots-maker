import React from "react";

import wallpaper1 from "./wallpaper-1.png";
import template from "./template.png";

const ratios = {
  [1.5822784810126582]: {
    left: 250,
    top: 150,
    bottom: 300,
  },
  [1.482213438735178]: {
    left: 250,
    top: 86,
    bottom: 236,
  },
  [1.3489208633093526]: {
    left: 250,
    top: 86,
    bottom: 136,
  },
};

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.addEventListener("load", (e) => resolve(image));
    image.src = url;
  });

function App() {
  const [ctx, setCtx] = React.useState<CanvasRenderingContext2D>();
  const [screenshot, setScreenshot] = React.useState<HTMLImageElement>();
  const [results, setResults] = React.useState<string[]>([]);

  React.useEffect(() => {
    document.addEventListener("dragover", (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    document.addEventListener("drop", (e) => {
      e.stopPropagation();
      e.preventDefault();

      handleFileChange(e.dataTransfer?.files?.[0]);
    });
  }, []);

  const handleFileChange = (file?: File) => {
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      loadImage(fileUrl).then((image) => {
        setScreenshot(image);
      });
    }
  };

  React.useEffect(() => {
    if (!ctx) return;

    (async () => {
      const wallpaper = await loadImage(wallpaper1);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      const image = { width: 2000, height: 1250 };

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      ctx.drawImage(
        wallpaper,
        -100,
        -100,
        image.width + 200,
        image.height + 200
      );

      if (screenshot) {
        const screenshotRatio = screenshot.width / screenshot.height;
        const spacings = ratios[screenshotRatio as keyof typeof ratios];

        ctx.drawImage(
          screenshot,
          0,
          0,
          screenshot.width,
          screenshot.height,
          spacings.left,
          spacings.top,
          image.width - 500,
          image.height - spacings.bottom
        );
      }

      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = 0.3;

      ctx.drawImage(wallpaper, 0, 0, image.width, image.height);

      if (!screenshot) return;

      const url = await fetch(ctx.canvas.toDataURL())
        .then((res) => res.blob())
        .then((blob) => URL.createObjectURL(blob));

      setResults([...results, url]);
    })();
  }, [ctx, screenshot]);

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
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";

          handleFileChange(file);
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1em",
        }}
      >
        {results.map((res) => (
          <div key={res}>
            <img src={res} width="100%" />
          </div>
        ))}
      </div>
    </main>
  );
}

export default App;
