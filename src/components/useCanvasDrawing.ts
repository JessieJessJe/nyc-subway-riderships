import { useCallback, useState, useEffect } from "react";
import { StationData, CanvasDimensions } from "./type";
import {
  scaleCoordinates,
  interpolateColor,
  getColorForRidership,
} from "./utils";

export const useCanvasDrawing = (
  canvasDimensions: CanvasDimensions,
  maxRidership: number,
  minRidership: number,
  midpointRidership: number,
  typedData: StationData[],
  tooltipRef: React.RefObject<HTMLDivElement>
) => {
  const [hoveredStation, setHoveredStation] = useState<StationData | null>(
    null
  );

  const calculateGradient = useCallback(
    (hourInt: number, ctx: CanvasRenderingContext2D) => {
      const black = "#000000";

      let gradient: string | CanvasGradient = black;
      gradient = black;
      return gradient;
    },
    [canvasDimensions.height]
  );

  const drawOnCanvas = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      bgCtx: CanvasRenderingContext2D | null,
      day: string,
      hour: string
    ) => {
      ctx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);

      const hourInt = parseInt(hour, 10);
      const gradient = calculateGradient(hourInt, ctx);

      // Update background canvas
      if (bgCtx) {
        bgCtx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
        bgCtx.fillStyle = gradient;
        bgCtx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);
      }

      const handleMouseMove = (event: MouseEvent | TouchEvent) => {
        const rect = ctx.canvas.getBoundingClientRect();
        const mouseX = (event as MouseEvent).clientX - rect.left;
        const mouseY = (event as MouseEvent).clientY - rect.top;

        let foundStation: StationData | null = null;
        const filteredData = typedData.filter(
          (station) =>
            station.transit_day === day && station.transit_hour === hour
        );

        filteredData.forEach((station: StationData) => {
          const { x, y } = scaleCoordinates(
            station.latitude,
            station.longitude,
            canvasDimensions
          );
          const distance = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2);
          if (distance < 8) {
            foundStation = station;
          }
        });

        setHoveredStation(foundStation);

        const tooltip = tooltipRef.current;
        if (hoveredStation && tooltip) {
          tooltip.style.left = `${mouseX + 10}px`;
          tooltip.style.top = `${mouseY + 10}px`;
          tooltip.innerHTML = `
            <div class="font-bold">${hoveredStation.station_complex}</div>
            <div><span class="text-gray-800">${hoveredStation.transit_day} ${hoveredStation.transit_hour}</span></div>
            <div class="pt-2">Approximately <span class="font-bold">${hoveredStation.total_ridership}</span> riders</div>
          `;
          tooltip.classList.remove("hidden");
        } else if (tooltip) {
          tooltip.classList.add("hidden");
        }

        if (foundStation) {
          ctx.canvas.style.cursor = "pointer";
        } else {
          ctx.canvas.style.cursor = "default";
        }
      };

      // Add both mouse and touch event listeners
      const canvas = ctx.canvas;
      canvas.addEventListener("mousemove", handleMouseMove);

      let initialDistance = 0;
      let initialDimensions = { ...canvasDimensions };

      const handleTouchStart = (event: TouchEvent) => {
        if (event.touches.length === 2) {
          const touch1 = event.touches[0];
          const touch2 = event.touches[1];
          initialDistance = Math.hypot(
            touch1.clientX - touch2.clientX,
            touch1.clientY - touch2.clientY
          );
          initialDimensions = { ...canvasDimensions };
        }
      };

      const handleTouchMove = (event: TouchEvent) => {
        if (event.touches.length === 2) {
          const touch1 = event.touches[0];
          const touch2 = event.touches[1];
          const currentDistance = Math.hypot(
            touch1.clientX - touch2.clientX,
            touch1.clientY - touch2.clientY
          );

          // Calculate scale factor
          const scale = Math.min(
            Math.max(currentDistance / initialDistance, 0.5),
            3
          );

          // Update canvas dimensions based on scale
          const newWidth = initialDimensions.width * scale;
          const newHeight = initialDimensions.height * scale;

          // Update canvas size
          ctx.canvas.width = newWidth;
          ctx.canvas.height = newHeight;
          if (bgCtx) {
            bgCtx.canvas.width = newWidth;
            bgCtx.canvas.height = newHeight;
          }

          // Redraw with new dimensions
          drawOnCanvas(ctx, bgCtx, day, hour);
        }
      };

      canvas.addEventListener("touchstart", handleTouchStart);
      canvas.addEventListener("touchmove", handleTouchMove);

      // Draw stations
      typedData.forEach((station: StationData) => {
        if (station.transit_day === day && station.transit_hour === hour) {
          const { x, y } = scaleCoordinates(
            station.latitude,
            station.longitude,
            canvasDimensions
          );

          const minRadius = 3;
          const maxRadius = 7;
          let brightness: number;
          let radius: number;
          let gradient;

          brightness = 1.0;
          let upperCutoffRidership = 1122.02;
          let lowerCutoffRidership = 19.95;

          if (station.total_ridership >= upperCutoffRidership) {
            radius = maxRadius;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);

            // Create a radial gradient for the fill
            const fillGradient = ctx.createRadialGradient(
              x,
              y,
              0,
              x,
              y,
              radius
            );
            fillGradient.addColorStop(0, "#FFFFFF"); // Start color (center)
            fillGradient.addColorStop(0.8, "#FFFFFF"); // Start color (center)
            fillGradient.addColorStop(1, "rgba(255, 255, 255, 0)"); // End color (edge)
            // Set the fill style to a solid color or gradient
            ctx.fillStyle = fillGradient;
            ctx.fill();

            // ctx.strokeStyle = "#ff0000";
            // ctx.stroke();
          } else if (station.total_ridership <= lowerCutoffRidership) {
            radius = minRadius;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);

            // Create a radial gradient for the fill
            const fillGradient = ctx.createRadialGradient(
              x,
              y,
              0,
              x,
              y,
              radius
            );
            fillGradient.addColorStop(0, "#000000"); // Start color (center)
            fillGradient.addColorStop(0.9, "#8E0485"); // #C1DD0A
            fillGradient.addColorStop(1, "#8E0485"); // #C1DD0A

            // Set the fill style to the radial gradient
            ctx.fillStyle = fillGradient;
            ctx.fill(); // Fill the circle

            // ctx.strokeStyle = "#C1DD0A";
            // ctx.stroke();
          } else {
            // Convert to logarithmic scale for radius calculation
            const logMin = Math.log(lowerCutoffRidership);
            const logMax = Math.log(upperCutoffRidership);
            const logValue = Math.log(station.total_ridership);
            const logNormalizedRidership =
              (logValue - logMin) / (logMax - logMin);

            radius =
              minRadius + logNormalizedRidership * (maxRadius - minRadius);

            //soft edges for natural appearance
            gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

            gradient.addColorStop(
              0,
              getColorForRidership(logNormalizedRidership, 1)
            );
            gradient.addColorStop(
              0.8,
              getColorForRidership(logNormalizedRidership, brightness)
            );
            gradient.addColorStop(
              1,
              getColorForRidership(logNormalizedRidership, brightness * 0.1)
            );
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = gradient;
            ctx.fill();
          }
        }
      });

      // Update cleanup
      return () => {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
      };
    },
    [
      canvasDimensions,
      calculateGradient,
      maxRidership,
      midpointRidership,
      hoveredStation,
      typedData,
      tooltipRef,
    ]
  );

  return { drawOnCanvas };
};
