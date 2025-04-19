
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomerInformationProps {
  name: string;
  email: string;
  phone: string;
  location: string;
  carModel: string;
  malaysianStates: string[];
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export function CustomerInformation({
  name,
  email,
  phone,
  location,
  carModel,
  malaysianStates,
  isEditing,
  onChange,
  onSelectChange,
}: CustomerInformationProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={onChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={onChange}
          required
          readOnly={isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          value={phone}
          onChange={onChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">State (Negeri)</Label>
        <Select
          value={location}
          onValueChange={(value) => onSelectChange("location", value)}
        >
          <SelectTrigger id="location" className="w-full">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {malaysianStates.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="car_model">Car Model</Label>
        <Input
          id="car_model"
          name="car_model"
          value={carModel}
          onChange={onChange}
          required
        />
      </div>
    </div>
  );
}
