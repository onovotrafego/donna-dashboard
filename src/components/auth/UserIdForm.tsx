
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface UserIdFormProps {
  remotejid: string;
  setRemotejid: (value: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const UserIdForm: React.FC<UserIdFormProps> = ({ 
  remotejid, 
  setRemotejid, 
  loading, 
  onSubmit 
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="remotejid">ID de Usuário</Label>
        <Input
          id="remotejid"
          placeholder="Digite seu ID de usuário"
          value={remotejid}
          onChange={(e) => setRemotejid(e.target.value)}
          required
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-finance-primary hover:bg-finance-primary/90" 
        disabled={loading}
      >
        {loading ? "Verificando..." : "Continuar"}
      </Button>
    </form>
  );
};

export default UserIdForm;
