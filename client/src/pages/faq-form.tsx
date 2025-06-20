import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertFaqSchema, type Faq } from "@shared/schema";
import { z } from "zod";

interface FaqFormData {
  question: string;
  answer: string;
  category: string;
  is_published: boolean;
  order_index: number;
}

const formSchema = insertFaqSchema;

export default function FaqForm() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/faqs/:id/edit");
  const [createMatch] = useRoute("/faqs/new");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const faqId = params?.id ? parseInt(params.id) : null;
  const isEditing = !!match;
  const isCreating = !!createMatch;

  const form = useForm<FaqFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      answer: "",
      category: "",
      is_published: true,
      order_index: 0
    }
  });

  // Load FAQ data for editing
  const { data: faq } = useQuery({
    queryKey: ["/api/faqs", faqId],
    enabled: !isCreating && !!faqId,
    select: (data: Faq) => data,
  });

  // Update form when FAQ data is loaded
  useEffect(() => {
    if (faq) {
      form.reset({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        is_published: faq.is_published,
        order_index: faq.order_index
      });
    }
  }, [faq, form]);

  const createMutation = useMutation({
    mutationFn: (data: FaqFormData) => apiRequest("POST", "/api/faqs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      toast({
        title: "FAQ created",
        description: "The FAQ has been successfully created.",
      });
      setLocation("/faqs");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create the FAQ. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FaqFormData) => apiRequest("PUT", `/api/faqs/${faqId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/faqs", faqId] });
      toast({
        title: "FAQ updated",
        description: "The FAQ has been successfully updated.",
      });
      setLocation("/faqs");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update the FAQ. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FaqFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const commonCategories = [
    "General",
    "Appointments",
    "Services",
    "Pricing",
    "Policies",
    "Payment",
    "Location",
    "Hours",
    "Contact",
    "Products"
  ];

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/faqs")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to FAQs
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-barber-primary rounded-xl flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isEditing ? "Edit FAQ" : "New FAQ"}
            </h1>
            <p className="text-slate-600">
              {isEditing ? "Update FAQ details" : "Create a new frequently asked question"}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FAQ Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Question */}
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="What is your question?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Answer */}
              <FormField
                control={form.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a detailed answer to the question..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category and Order */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter category or select from common ones"
                          {...field}
                          list="categories"
                        />
                      </FormControl>
                      <datalist id="categories">
                        {commonCategories.map((category) => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order_index"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <p className="text-sm text-slate-500">
                        Lower numbers appear first (0 = highest priority)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Published Status */}
              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Published
                      </FormLabel>
                      <div className="text-sm text-slate-500">
                        Make this FAQ visible to customers
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/faqs")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : isEditing ? "Update FAQ" : "Create FAQ"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tips for Writing Good FAQs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-slate-600">
            <div>
              <strong>Questions:</strong> Write questions from the customer's perspective. Use clear, simple language.
            </div>
            <div>
              <strong>Answers:</strong> Provide complete, helpful answers. Include relevant details but keep it concise.
            </div>
            <div>
              <strong>Categories:</strong> Group related questions together. Common categories include appointments, services, pricing, and policies.
            </div>
            <div>
              <strong>Order:</strong> Put the most important and frequently asked questions first (lower order numbers).
            </div>
            <div>
              <strong>Publishing:</strong> Use draft status to prepare FAQs before making them visible to customers.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}