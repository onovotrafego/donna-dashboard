
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthTabsProps {
  loginMethod: 'remotejid' | 'email';
  setLoginMethod: (method: 'remotejid' | 'email') => void;
  remotejidForm: React.ReactNode;
  emailForm: React.ReactNode;
}

const AuthTabs: React.FC<AuthTabsProps> = ({
  loginMethod,
  setLoginMethod,
  remotejidForm,
  emailForm
}) => {
  return (
    <Tabs 
      value={loginMethod}
      onValueChange={(value) => setLoginMethod(value as 'remotejid' | 'email')}
      className="mb-6"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="remotejid">ID de Usuário</TabsTrigger>
        <TabsTrigger value="email">E-mail</TabsTrigger>
      </TabsList>
      <TabsContent value="remotejid">
        {remotejidForm}
      </TabsContent>
      <TabsContent value="email">
        {emailForm}
      </TabsContent>
    </Tabs>
  );
};

export default AuthTabs;
