
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterFormFieldsProps {
  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
}

export const RegisterFormFields = ({ 
  name, 
  email, 
  onNameChange, 
  onEmailChange 
}: RegisterFormFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input 
          id="name" 
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter your name" 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Enter your email" 
        />
      </div>
    </>
  );
};
