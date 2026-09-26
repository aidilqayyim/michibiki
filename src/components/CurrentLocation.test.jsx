import { useMesh } from "../data/MeshProvider";
import { meshFixture } from "../test/meshFixture";
jest.mock("../data/MeshProvider", () => ({ useMesh: jest.fn() }));
beforeEach(() => useMesh.mockReturnValue(meshFixture()));
import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import CurrentLocation from "./CurrentLocation";

test("browser GPS moves only the selected node and recenters the map", async () => {
  let success;
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: jest.fn((callback) => { success = callback; }) } });
  const map = { jumpTo: jest.fn() };
  const markers = { current: { B12: { setLngLat: jest.fn() }, A07: { setLngLat: jest.fn() } } };
  const locationRef = { current: null };
  render(<CurrentLocation map={map} nodeId="B12" markers={markers} locationRef={locationRef} />);
  await act(async () => success({ coords: { latitude: 3.14, longitude: 101.69, accuracy: 12 } }));
  expect(markers.current.B12.setLngLat).toHaveBeenCalledWith([101.69, 3.14]);
  expect(markers.current.A07.setLngLat).not.toHaveBeenCalled();
  expect(map.jumpTo).toHaveBeenCalledWith({ center: [101.69, 3.14], zoom: 15 });
  expect(screen.getByRole("status")).toHaveTextContent("B12: phone GPS location");
});

test("denied permission preserves demo locations", () => {
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (success, fail) => fail({ code: 1 }) } });
  const map = { jumpTo: jest.fn() };
  render(<CurrentLocation map={map} nodeId="A07" markers={{ current: {} }} locationRef={{ current: null }} />);
  expect(screen.getByRole("status")).toHaveTextContent("Location access denied");
  expect(map.jumpTo).not.toHaveBeenCalled();
});
