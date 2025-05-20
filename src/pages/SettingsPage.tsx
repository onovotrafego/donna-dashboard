
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Verify current password
      const { data: userData, error: fetchError } = await supabase
        .from('donna_clientes')
        .select('password_hash')
        .eq('id', user?.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (userData.password_hash !== currentPassword) {
        toast({
          title: "Senha atual incorreta",
          description: "A senha atual fornecida está incorreta",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Update password
      const { error: updateError } = await supabase
        .from('donna_clientes')
        .update({ password_hash: newPassword })
        .eq('id', user?.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso"
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setDialogOpen(false);
      
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Erro ao atualizar senha",
        description: "Ocorreu um erro ao tentar atualizar sua senha",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout title="Ajustes">
      <div className="max-w-md mx-auto">
        <div className="financial-card mb-4">
          <h3 className="text-lg font-semibold mb-4">Segurança</h3>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">Alterar Senha</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para alterar sua senha.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirme a Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Atualizando..." : "Atualizar Senha"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="financial-card">
          <h3 className="text-lg font-semibold mb-4">Mais Configurações</h3>
          <p className="text-muted-foreground text-center py-8">
            Em breve você poderá personalizar mais configurações do seu assistente financeiro.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
