import React from 'react';
import { CSSTransition } from 'react-transition-group';
import { MdCancel } from 'react-icons/md';

import styles from './BottomSheet.module.css';

export type BottemSheetProps = {
  isOpen: boolean;
  onClose?: (e: React.MouseEvent<SVGElement, MouseEvent>) => void;
};

const BottomSheet: React.FC<BottemSheetProps> = ({
  isOpen = false,
  onClose,
  children,
}) => {
  return (
    <CSSTransition
      in={isOpen}
      timeout={300}
      classNames={{
        enter: styles.enter,
        enterActive: styles.enterActive,
        exit: styles.exit,
        exitActive: styles.exitActive,
      }}
      unmountOnExit
    >
      <div className="absolute left-0 right-0 max-w-screen-sm bg-gray-50 bottom-0 z-10 overflow-y-hidden top-16 flex flex-col">
        <div className="sticky top-0 flex justify-end flex-grow-0">
          <MdCancel
            className="mr-2 mt-2 fill-current text-orange-700 cursor-pointer hover:opacity-80"
            onClick={onClose}
            size={36}
          />
        </div>
        <div className="relative overflow-y-hidden bg-gray-50 flex-grow">
          <div className="absolute top-0 bottom-0 left-0 right-0 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </CSSTransition>
  );
};

export default BottomSheet;
