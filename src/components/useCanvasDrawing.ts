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
      const pink = "#C63CBC";
      const orange = "#FF4500";
      const darkBlue = "#141233";
      const black = "#000000";

      let gradient: string | CanvasGradient = black;

      if (hourInt > 5 && hourInt <= 7) {
        const ratio = (hourInt - 5) / 2;
        gradient = ctx.createLinearGradient(
          0,
          canvasDimensions.height,
          0,
          canvasDimensions.height - 100
        );
        gradient.addColorStop(0, interpolateColor(pink, orange, ratio));
        gradient.addColorStop(1, interpolateColor(black, darkBlue, ratio));
      } else if (hourInt >= 7 && hourInt <= 14) {
        gradient = darkBlue;
      } else if (hourInt >= 15 && hourInt < 18) {
        gradient = darkBlue;
      } else if (hourInt >= 18 && hourInt < 20) {
        const ratio = (hourInt - 18) / 2; // Ratio from 0 to 1
        gradient = ctx.createLinearGradient(
          0,
          canvasDimensions.height,
          0,
          canvasDimensions.height - 100
        );
        gradient.addColorStop(0, interpolateColor(orange, pink, ratio)); // Orange to pink
        gradient.addColorStop(1, interpolateColor(darkBlue, black, ratio)); // Dark blue to black
      } else if (hourInt >= 21 && hourInt < 24) {
        gradient = black;
      } else {
        gradient = black;
      }
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

      // Apply background gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);

      // Update background canvas
      if (bgCtx) {
        bgCtx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
        bgCtx.fillStyle = gradient;
        bgCtx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);
      }

      const handleMouseMove = (event: MouseEvent) => {
        const rect = ctx.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

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
          tooltip.style.left = `${event.clientX + 10}px`;
          tooltip.style.top = `${event.clientY + 10}px`;
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

      // Add mouse move event listener
      const canvas = ctx.canvas;
      canvas.addEventListener("mousemove", handleMouseMove);

      // Draw stations
      typedData.forEach((station: StationData) => {
        if (station.transit_day === day && station.transit_hour === hour) {
          const { x, y } = scaleCoordinates(
            station.latitude,
            station.longitude,
            canvasDimensions
          );

          const minRadius = 4;
          const maxRadius = 8;
          let brightness: number;
          let radius: number;
          let gradient;

          brightness = 1.0;
          let cutoffRidership = 1000;

          if (station.total_ridership >= cutoffRidership) {
            radius = maxRadius * 0.8;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
            ctx.strokeStyle = "#EFEFEF";
            ctx.stroke();
          } else {
            //radius based on ridership
            const normalizedRidership =
              station.total_ridership / cutoffRidership;
            radius = minRadius + normalizedRidership * (maxRadius - minRadius);

            //soft edges for natural appearance
            gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(
              0,
              getColorForRidership(normalizedRidership, 1)
            );
            gradient.addColorStop(
              0.5,
              getColorForRidership(normalizedRidership, brightness)
            );
            gradient.addColorStop(
              1,
              getColorForRidership(normalizedRidership, brightness * 0.01)
            );
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = gradient;
            ctx.fill();
          }
        }
      });

      return () => {
        canvas.removeEventListener("mousemove", handleMouseMove);
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
