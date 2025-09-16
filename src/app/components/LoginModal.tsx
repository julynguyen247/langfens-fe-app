import React from "react";
import Modal from "@/components/Modal"; // đổi path cho phù hợp
import { facebook, google } from "../utils/icons";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onLoginWithGoogle?: () => void | Promise<void>;
  onLoginWithFacebook?: () => void | Promise<void>;
  loadingProvider?: "google" | "facebook" | null;
  title?: React.ReactNode;
};

export default function LoginModal({
  open,
  onClose,
  onLoginWithGoogle,
  onLoginWithFacebook,
  loadingProvider = null,
  title = "Login",
}: LoginModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-md">
      <div className="text-center space-y-6">
        <p className="text-sm ">
          Bạn có thể Đăng ký / Đăng nhập bằng cách chọn{" "}
          <span className="font-semibold">Đăng nhập với Google</span> hoặc{" "}
          <span className="font-semibold">Đăng nhập với Facebook</span>
        </p>

        <div className="space-y-4">
          <button
            onClick={onLoginWithGoogle}
            disabled={loadingProvider === "google"}
            className="w-full select-none rounded-full border  px-4 py-2 text-sm font-semibold focus:border-none focus:outline-none focus:ring-2 focus:ring-[#317EFF] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            <div className="mx-auto flex max-w-md items-center gap-3 justify-center">
              {google}
              <span>
                {loadingProvider === "google"
                  ? "Đang đăng nhập với Google…"
                  : "Đăng nhập với Google"}
              </span>
            </div>
          </button>

          <button
            onClick={onLoginWithFacebook}
            disabled={loadingProvider === "facebook"}
            className="w-full select-none rounded-full border px-4 py-2 text-sm font-semibold  focus:border-none focus:outline-none focus:ring-2 focus:ring-[#317EFF] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            <div className="mx-auto flex max-w-md items-center gap-3 justify-center">
              {facebook}
              <span>
                {loadingProvider === "facebook"
                  ? "Đang đăng nhập với Facebook…"
                  : "Đăng nhập với Facebook"}
              </span>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
}
