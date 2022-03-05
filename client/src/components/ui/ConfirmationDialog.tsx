import React from 'react';

type ConfirmationDialogProps = {
  message: string;
  showDialog: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  message,
  showDialog,
  onCancel,
  onConfirm,
}) => {
  return showDialog ? (
    <div className="z-50 fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="absolute bg-white p-4 rounded-xl drop-shadow-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64">
        <div className="text-center font-semibold mb-6">{message}</div>
        <div className="flex justify-around my-2">
          <button className="boxless" onClick={onCancel}>
            Cancel
          </button>
          <button className="box btn-purple" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

export default ConfirmationDialog;
