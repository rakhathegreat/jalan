import { useMemo } from 'react';
import { formatDistance, formatMaxSpeed, parseBoolean, parseNumericValue } from '../mapHelpers';
import { calculateRoadLength } from '../mapGeoHelpers';
import type { RoadRow } from '../types';

export type RoadDetails = {
  roadClassLabel: string;
  conditionLabel: string;
  onewayLabel: string;
  maxSpeedLabel: string;
  refLabel: string | null;
  lanesLabel: string | null;
  bridgeFlag: boolean | null;
  tunnelFlag: boolean | null;
  lengthLabel: string;
  widthLabel: string;
  constructionLabel: string;
  cityLabel: string;
  districtLabel: string;
  subDistrictLabel: string;
  neighbourhoodLabel: string;
  rtValue: string | number;
  rwValue: string | number;
  trafficBadgeLabel: string;
};

export const useRoadDetails = (activeRoad: RoadRow | null) =>
  useMemo<RoadDetails>(() => {
    if (!activeRoad) {
      return {
        roadClassLabel: '-',
        conditionLabel: '-',
        onewayLabel: 'Tidak diketahui',
        maxSpeedLabel: 'Tidak diketahui',
        refLabel: null,
        lanesLabel: null,
        bridgeFlag: null,
        tunnelFlag: null,
        lengthLabel: '-',
        widthLabel: '-',
        constructionLabel: '-',
        cityLabel: '-',
        districtLabel: '-',
        subDistrictLabel: '-',
        neighbourhoodLabel: '-',
        rtValue: '-',
        rwValue: '-',
        trafficBadgeLabel: '-',
      };
    }

    const activeProps = (activeRoad.props ?? {}) as Record<string, any>;
    const roadClassLabel =
      activeProps.class && String(activeProps.class).trim()
        ? String(activeProps.class)
        : activeRoad.highway ?? '-';
    const unpaved = parseBoolean(activeProps.unpaved);
    const surfaceLabel = activeProps.surface
      ? String(activeProps.surface)
      : unpaved === true
        ? 'Tidak beraspal'
        : 'Asphalt';
    const conditionLabel = activeRoad.condition ?? '-';
    const onewayFlag = parseBoolean(activeProps.oneway);
    const onewayLabel =
      onewayFlag === null ? 'Tidak diketahui' : onewayFlag ? 'Satu arah' : 'Dua arah';
    const maxSpeedLabel = formatMaxSpeed(activeProps.maxspeed);
    const refLabel = activeRoad.osm_id ? String(activeRoad.osm_id) : null;
    const lanesLabel = activeProps.lanes ? String(activeProps.lanes) : null;
    const bridgeFlag = parseBoolean(activeProps.bridge);
    const tunnelFlag = parseBoolean(activeProps.tunnel);
    const lengthFromGeometry = calculateRoadLength(activeRoad.geom ?? null);
    const lengthLabel = formatDistance(activeRoad.length ?? lengthFromGeometry);
    const widthValue = parseNumericValue(activeRoad.width);
    const widthLabel = widthValue !== null ? `${widthValue} m` : '-';
    const constructionLabel = surfaceLabel;
    const cityLabel = activeRoad.kota ?? '-';
    const districtLabel = activeRoad.kecamatan ?? '-';
    const subDistrictLabel = activeRoad.kelurahan ?? '-';
    const neighbourhoodLabel = activeRoad.lingkungan ?? '-';
    const rtValue = activeRoad.rt ?? '-';
    const rwValue = activeRoad.rw ?? '-';

    const trafficBadgeLabel =
      [
        lanesLabel ? `${lanesLabel} lajur` : onewayLabel,
        maxSpeedLabel,
        bridgeFlag === true ? 'Jembatan' : null,
        tunnelFlag === true ? 'Terowongan' : null,
      ]
        .filter((item) => item && String(item).trim())
        .join(' • ') || '-';

    return {
      roadClassLabel,
      conditionLabel,
      onewayLabel,
      maxSpeedLabel,
      refLabel,
      lanesLabel,
      bridgeFlag,
      tunnelFlag,
      lengthLabel,
      widthLabel,
      constructionLabel,
      cityLabel,
      districtLabel,
      subDistrictLabel,
      neighbourhoodLabel,
      rtValue,
      rwValue,
      trafficBadgeLabel,
    };
  }, [activeRoad]);
