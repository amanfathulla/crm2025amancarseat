
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CustomerInformationProps {
  name: string;
  email: string;
  phone: string;
  location: string;
  address?: string;
  carModel: string;
  malaysianStates: string[];
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export function CustomerInformation({
  name,
  email,
  phone,
  location,
  address,
  carModel,
  malaysianStates,
  isEditing,
  onChange,
  onSelectChange,
}: CustomerInformationProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={onChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={onChange}
          placeholder="email@example.com"
          readOnly={isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone *</Label>
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
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="address">Alamat Lengkap (Optional)</Label>
        <Textarea
          id="address"
          name="address"
          value={address || ""}
          onChange={onChange}
          placeholder="No. rumah, Jalan, Taman, Poskod, Bandar"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="car_model">Car Model *</Label>
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
