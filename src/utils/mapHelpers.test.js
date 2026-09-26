import { distanceBetweenNodes, formatDistance, applyEnglishLabels } from "./mapHelpers";

test("GPS distance handles coincident points and a known equatorial arc", () => {
  const origin = { lat: 0, lng: 0 };
  expect(distanceBetweenNodes(origin, origin)).toBe(0);
  expect(distanceBetweenNodes(origin, { lat: 0, lng: 1 })).toBeCloseTo(111194.93, 1);
});

test("distance follows the short arc across the date line and is symmetric", () => {
  const a = { lat: 0, lng: 179.9 };
  const b = { lat: 0, lng: -179.9 };
  expect(distanceBetweenNodes(a, b)).toBeCloseTo(22238.99, 1);
  expect(distanceBetweenNodes(a, b)).toBe(distanceBetweenNodes(b, a));
});

test("distance switches between metres and kilometres", () => {
  expect(formatDistance(0)).toBe("0 m");
  expect(formatDistance(420.3)).toBe("420 m");
  expect(formatDistance(1234)).toBe("1.23 km");
});

test("English labels preserve road shields", () => {
  const map = {
    getStyle: () => ({ layers: [
      { id: "city", type: "symbol", layout: { "text-field": ["get", "name"] } },
      { id: "shield", type: "symbol", layout: { "text-field": ["get", "ref"] } },
      { id: "water", type: "fill" },
    ] }),
    setLayoutProperty: jest.fn(),
  };
  applyEnglishLabels(map);
  expect(map.setLayoutProperty).toHaveBeenCalledTimes(1);
  expect(map.setLayoutProperty.mock.calls[0].slice(0, 2)).toEqual(["city", "text-field"]);
  expect(map.setLayoutProperty.mock.calls[0][2][1]).toEqual(["get", "name_en"]);
});
