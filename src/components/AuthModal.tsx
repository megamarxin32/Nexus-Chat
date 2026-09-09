import React from 'react';
import { UserProfile } from '../types';
import { AuthScreen } from './AuthScreen';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  isAddAccountForPc?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isAddAccountForPc = false,
}) => {
  if (!isOpen) return null;

  return (
    <AuthScreen
      isModal={true}
      isAddAccountForPc={isAddAccountForPc}
      onCloseModal={onClose}
      onAuthSuccess={(userProfile) => {
        onLoginSuccess(userProfile);
        onClose();
      }}
    />
  );
};
