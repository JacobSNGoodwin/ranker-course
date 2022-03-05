import React from 'react';
import { MdClose } from 'react-icons/md';
import BottomSheet, { BottemSheetProps } from './ui/BottomSheet';
import { Participants } from 'shared/poll-types';

type ParticipantListProps = {
  participants?: Participants;
  userID?: string;
  isAdmin: boolean;
  onRemoveParticipant: (id: string) => void;
} & BottemSheetProps;

const ParticipantList: React.FC<ParticipantListProps> = ({
  isOpen,
  onClose,
  participants = {},
  onRemoveParticipant,
  userID,
  isAdmin,
}) => (
  <BottomSheet isOpen={isOpen} onClose={onClose}>
    <div className="px-8 flex flex-wrap justify-center mb-2">
      {Object.entries(participants).map(([id, participant]) => (
        <div
          key={id}
          className="mx-1 my-1 p-4 shadow-xl bg-white flex justify-between items-center rounded-md"
        >
          <span className="ml-2 mr-1 text-indigo-700 text-xl text-center">
            {participant}
          </span>
          {isAdmin && userID !== id && (
            <span
              className="ml-1 mr-2 cursor-pointer"
              onClick={() => onRemoveParticipant(id)}
            >
              <MdClose
                className="fill-current text-black align-middle"
                size={18}
              />
            </span>
          )}
        </div>
      ))}
    </div>
  </BottomSheet>
);

export default ParticipantList;
