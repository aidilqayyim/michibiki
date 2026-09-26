import { loadMesh } from "../data/MeshQueries";
jest.mock("../data/MeshQueries", () => ({ loadMesh: jest.fn() }));
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Connect from "./Connect";
import MeshProvider from "../data/MeshProvider";
import { ensureIdentity, writeBinding } from "../data/api";
import { meshFixture } from "../test/meshFixture";

jest.mock("../data/api", () => ({ ensureIdentity: jest.fn(), loadMesh: jest.fn(), writeBinding: jest.fn(), writeLocation: jest.fn(), insertRow: jest.fn() }));
let stored;
beforeEach(() => {
  stored = meshFixture();
  ensureIdentity.mockResolvedValue({ id: "test-user" });
  loadMesh.mockImplementation(async () => ({ ...stored }));
  writeBinding.mockImplementation(async (user, id) => { stored = { ...stored, boundId: id }; });
});
const mount = () => render(<MeshProvider><Connect /></MeshProvider>);

test("database binding survives remount and supports switching and disconnect", async () => {
  const view = mount();
  fireEvent.click(await screen.findByRole("button", { name: /Michibiki A07.*Select/ }));
  fireEvent.click(screen.getByRole("button", { name: "Bind device" }));
  expect(await screen.findByRole("heading", { name: "Michibiki A07" })).toBeInTheDocument();
  expect(writeBinding).toHaveBeenCalledWith("test-user", "A07");
  view.unmount();
  mount();
  expect(await screen.findByRole("heading", { name: "Michibiki A07" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Michibiki B12.*Select/ }));
  fireEvent.click(screen.getByRole("button", { name: "Bind device" }));
  expect(await screen.findByRole("heading", { name: "Michibiki B12" })).toBeInTheDocument();
  fireEvent.click(await screen.findByRole("button", { name: "Disconnect" }));
  expect(await screen.findByRole("heading", { name: "Ready to connect" })).toBeInTheDocument();
});

test("a rejected binding preserves the current device", async () => {
  stored.boundId = "A07";
  writeBinding.mockRejectedValue(new Error("Device already bound to another user."));
  mount();
  fireEvent.click(await screen.findByRole("button", { name: /Michibiki B12.*Select/ }));
  fireEvent.click(screen.getByRole("button", { name: "Bind device" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Device already bound");
  expect(screen.getByRole("heading", { name: "Michibiki A07" })).toBeInTheDocument();
});

test("a connection failure offers retry without rendering fake devices", async () => {
  loadMesh.mockRejectedValue(new Error("Network unavailable"));
  mount();
  expect(await screen.findByRole("alert")).toHaveTextContent("Network unavailable");
  expect(screen.getByRole("button", { name: "Retry connection" })).toBeInTheDocument();
  expect(screen.queryByText("Michibiki A07")).not.toBeInTheDocument();
});
