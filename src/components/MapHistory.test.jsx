import { useMesh } from "../data/MeshProvider";
import { meshFixture } from "../test/meshFixture";
jest.mock("../data/MeshProvider", () => ({ useMesh: jest.fn() }));
beforeEach(() => useMesh.mockReturnValue(meshFixture()));
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
jest.mock("react-router-dom", () => jest.requireActual("react-router"), { virtual: true });
jest.mock("maplibre-gl", () => ({
  Marker: jest.fn().mockImplementation(() => ({ setLngLat() { return this; }, setPopup() { return this; }, addTo() { return this; }, remove: jest.fn() })),
  Popup: jest.fn().mockImplementation(() => ({ setHTML() { return this; } })),
  LngLatBounds: jest.fn().mockImplementation(() => ({ extend: jest.fn() })),
}), { virtual: true });
const { MemoryRouter } = require("react-router-dom");
const { Marker, Popup, LngLatBounds } = require("maplibre-gl");
const MapHistory = require("./MapHistory").default;

beforeEach(() => {
  Marker.mockImplementation(() => ({ setLngLat() { return this; }, setPopup() { return this; }, addTo() { return this; }, remove: jest.fn() }));
  Popup.mockImplementation(() => ({ setHTML() { return this; } }));
  LngLatBounds.mockImplementation(() => ({ extend: jest.fn() }));
});

test("history draws only the selected date and node, then restores live markers on exit", () => {
  const element = document.createElement("button");
  const liveMarkers = { current: { A07: { getElement: () => element, getPopup: () => ({ remove: jest.fn() }) } } };
  const map = { isStyleLoaded: () => true, getSource: jest.fn(), addSource: jest.fn(), addLayer: jest.fn(), on: jest.fn(), off: jest.fn(), fitBounds: jest.fn(), getStyle: () => ({}), getLayer: () => true, removeLayer: jest.fn(), removeSource: jest.fn() };
  render(<MemoryRouter initialEntries={["/map?historyDate=2026-09-25&historyNode=A07"]}><MapHistory map={map} liveMarkers={liveMarkers} /></MemoryRouter>);
  expect(Marker).toHaveBeenCalledTimes(4);
  expect(screen.getByRole("heading", { name: "25 September 2026" })).toBeInTheDocument();
  expect(element.style.display).toBe("none");
  expect(map.addSource.mock.calls[0][1].data.features).toHaveLength(1);
  expect(map.addSource.mock.calls[0][1].data.features[0].geometry.coordinates).toHaveLength(4);
  fireEvent.click(screen.getByRole("button", { name: "Exit history" }));
  expect(element.style.display).toBe("grid");
  expect(map.removeLayer).toHaveBeenCalledWith("tracking-history");
  expect(Marker.mock.results.every(({ value }) => value.remove.mock.calls.length === 1)).toBe(true);
});
