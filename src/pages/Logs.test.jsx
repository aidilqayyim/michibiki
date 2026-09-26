import { useMesh } from "../data/MeshProvider";
import { meshFixture } from "../test/meshFixture";
jest.mock("../data/MeshProvider", () => ({ useMesh: jest.fn() }));
beforeEach(() => useMesh.mockReturnValue(meshFixture()));
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
// CRA's Jest resolver predates the package export map used by Router 7.
jest.mock("react-router-dom", () => jest.requireActual("react-router"), { virtual: true });
const { MemoryRouter } = require("react-router-dom");
const Logs = require("./Logs").default;

test("node logs are grouped by date and map links retain node and date", () => {
  render(<MemoryRouter initialEntries={["/logs?node=B12"]}><Logs /></MemoryRouter>);
  expect(screen.getByRole("combobox")).toHaveValue("B12");
  expect(screen.getByRole("heading", { name: "26 September 2026" })).toBeInTheDocument();
  expect(screen.getAllByRole("article")).toHaveLength(12);
  expect(screen.getAllByRole("link", { name: "Show on Map" })[0]).toHaveAttribute("href", "/map?historyDate=2026-09-26&historyNode=B12");
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "all" } });
  expect(screen.getAllByRole("article")).toHaveLength(48);
  expect(screen.getAllByRole("link", { name: "Show on Map" })[0]).toHaveAttribute("href", "/map?historyDate=2026-09-26&historyNode=all");
});

test("unknown node shows an empty state", () => {
  render(<MemoryRouter initialEntries={["/logs?node=missing"]}><Logs /></MemoryRouter>);
  expect(screen.getByText("No tracking logs for this node.")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Show on Map" })).not.toBeInTheDocument();
});
