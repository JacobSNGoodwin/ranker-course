import React, { useEffect } from 'react';
import { useState } from 'react';
import { MdCancel } from 'react-icons/md';
import { CSSTransition } from 'react-transition-group';

import styles from './SnackBar.module.css';

type SnackBarProps = {
  type?: 'standard' | 'error';
  title?: string;
  message: string;
  show: boolean;
  autoCloseDuration?: number;
  onClose: () => void;
};

const snackBarStyles = {
  standard: 'bg-gray-100 bg-opacity-50',
  error: 'bg-red-600 text-white',
};

const SnackBar: React.FC<SnackBarProps> = ({
  type = 'standard',
  title,
  message,
  show,
  onClose,
  autoCloseDuration,
}) => {
  const outerStyles = snackBarStyles[type];
  const [showSnackBar, setShowSnackBar] = useState(false);

  const handleCloseSnackBar = () => {
    setShowSnackBar(false);
  };

  useEffect(() => {
    console.log('snackbar useEffect', title, message, show);
    if (show) {
      setShowSnackBar(true);
    }

    const autoTimer =
      autoCloseDuration &&
      setTimeout(() => handleCloseSnackBar(), autoCloseDuration);

    return () => {
      autoTimer && clearTimeout(autoTimer);
    };
  }, [show, message, title]);

  return (
    <CSSTransition
      in={showSnackBar}
      timeout={300}
      classNames={{
        enter: styles.enter,
        enterActive: styles.enterActive,
        exit: styles.exit,
        exitActive: styles.exitActive,
      }}
      unmountOnExit
      onExited={() => onClose()}
    >
      <div
        className={`relative shadow-md py-2 mb-1 z-50 rounded-b-md text-center w-full sm:w-1/2 top-0 left-0 right-0 mx-auto bg-opacity-100 ${outerStyles}`}
      >
        <div className="absolute top-0 right-0">
          <MdCancel
            className="fill-current mr-1 mt-1 cursor-pointer hover:opacity-80"
            onClick={() => handleCloseSnackBar()}
            size={24}
          />
        </div>
        <div className="mt-4 mx-8 mb-2">
          {title && <h3 className="font-semibold">{title}</h3>}
          <div className="text-sm font-light italic">{message}</div>
        </div>
      </div>
    </CSSTransition>
  );
};

export default SnackBar;
