import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileInput } from "@/components/ui/file-input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { IdCard, FileText, Shield, Truck } from "lucide-react";

const driverFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  experience: z.enum(["0-1", "1-3", "3-5", "5+"], {
    required_error: "Please select your experience",
  }),
  vanType: z.enum(["small", "medium", "large", "luton"], {
    required_error: "Please select your van type",
  }),
  location: z.string().min(1, { message: "Location is required" }),
  licenseDocument: z.instanceof(File, { message: "Driver's license is required" }),
  insuranceDocument: z.instanceof(File, { message: "Insurance certificate is required" }),
  liabilityDocument: z.instanceof(File, { message: "Public liability insurance is required" }),
  vehiclePhoto: z.instanceof(File, { message: "Vehicle photo is required" }),
  agreement: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
});

type DriverFormValues = z.infer<typeof driverFormSchema>;

export default function DriverRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      agreement: false,
    },
  });

  async function onSubmit(data: DriverFormValues) {
    setIsSubmitting(true);
    try {
      // Create FormData to handle file uploads
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("experience", data.experience);
      formData.append("vanType", data.vanType);
      formData.append("location", data.location);
      formData.append("licenseDocument", data.licenseDocument);
      formData.append("insuranceDocument", data.insuranceDocument);
      formData.append("liabilityDocument", data.liabilityDocument);
      formData.append("vehiclePhoto", data.vehiclePhoto);

      // Submit form data to API
      await fetch('/api/drivers/register', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      toast({
        title: "Application Submitted",
        description: "We've received your application and will review it shortly.",
      });

      // Reset form
      form.reset();
    } catch (error) {
      console.error("Error submitting driver application:", error);
      toast({
        title: "Submission Failed",
        description: "There was a problem submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6">Join Us as a Driver</h2>
      <p className="text-center text-gray-600 mb-12">
        Become part of our growing network of professional drivers. Flexible hours, competitive rates,
        and regular work opportunities.
      </p>

      <div className="bg-gray-50 rounded-xl shadow-md p-6 lg:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your phone number" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Years of Experience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0-1">Less than 1 year</SelectItem>
                        <SelectItem value="1-3">1-3 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="5+">5+ years</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vanType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Van Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select van type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="small">Small Wheelbase Van</SelectItem>
                        <SelectItem value="medium">Medium Wheelbase Van</SelectItem>
                        <SelectItem value="large">Long Wheelbase Van</SelectItem>
                        <SelectItem value="luton">Luton Van</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h3 className="font-bold text-lg mt-8 mb-4">Document Upload</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Please upload the following documents. All information is securely stored and verified.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="licenseDocument"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Driver's License</FormLabel>
                    <FormControl>
                      <FileInput
                        icon={<IdCard className="text-gray-400 text-3xl mb-2" />}
                        text="Upload your driver's license (front and back)"
                        accept="image/*,.pdf"
                        onChange={(file) => onChange(file)}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insuranceDocument"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Insurance Certificate</FormLabel>
                    <FormControl>
                      <FileInput
                        icon={<FileText className="text-gray-400 text-3xl mb-2" />}
                        text="Upload your vehicle insurance document"
                        accept="image/*,.pdf"
                        onChange={(file) => onChange(file)}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="liabilityDocument"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Public Liability Insurance</FormLabel>
                    <FormControl>
                      <FileInput
                        icon={<Shield className="text-gray-400 text-3xl mb-2" />}
                        text="Upload your public liability insurance"
                        accept="image/*,.pdf"
                        onChange={(file) => onChange(file)}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehiclePhoto"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Vehicle Photo</FormLabel>
                    <FormControl>
                      <FileInput
                        icon={<Truck className="text-gray-400 text-3xl mb-2" />}
                        text="Upload a clear photo of your vehicle"
                        accept="image/*"
                        onChange={(file) => onChange(file)}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="agreement"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm text-gray-600">
                      I agree to the <a href="/terms-and-conditions" className="text-primary hover:underline">Terms and Conditions</a> and understand that EasyMove will verify my documents before approval.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <div className="text-center mt-8">
              <Button
                type="submit"
                className="bg-[#FF9500] text-white font-bold py-3 px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
