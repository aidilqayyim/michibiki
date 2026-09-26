import { useMesh } from "../data/MeshProvider";
import { meshFixture } from "../test/meshFixture";
jest.mock("../data/MeshProvider", () => ({ useMesh: jest.fn() }));
beforeEach(() => useMesh.mockReturnValue(meshFixture()));
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import EmergencyButton from "./EmergencyButton";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

test("opening and canceling the warning does not send an alert", () => {
  const onOpen = jest.fn();
  render(<EmergencyButton onOpen={onOpen} />);
  fireEvent.click(screen.getByRole("button", { name: "Emergency warning" }));
  expect(onOpen).toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  const cancel = screen.getByRole("button", { name: "Cancel" });
  fireEvent.submit(cancel.closest("form"), { submitter: cancel });
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("explicit confirmation saves an alert before showing success", async () => {
  render(<EmergencyButton onOpen={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Emergency warning" }));
  const send = screen.getByRole("button", { name: "Send demo warning" });
  fireEvent.click(send);
  expect(await screen.findByRole("status")).toHaveTextContent("No LoRa warning was transmitted");
});

test("failed alert save stays open and does not claim success", async () => {
  useMesh.mockReturnValue({ ...meshFixture(), sendEmergency: jest.fn().mockRejectedValue(new Error("Server unavailable")) });
  render(<EmergencyButton onOpen={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Emergency warning" }));
  fireEvent.click(screen.getByRole("button", { name: "Send demo warning" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Server unavailable");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
