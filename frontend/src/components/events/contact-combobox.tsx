import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Contact, useCreateContact, useSearchContacts } from "@/lib/queries/contacts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContactComboboxProps {
  companyId: string;
  selectedContactIds: string[];
  selectedContacts?: Pick<Contact, "id" | "name">[];
  onAdd: (contact: Pick<Contact, "id" | "name">) => void;
  onRemove?: (contactId: string) => void;
}

type ContactMethod = "email" | "phone" | "linkedin_url";

const CONTACT_METHOD_OPTIONS: { value: ContactMethod; label: string; placeholder: string }[] = [
  { value: "email", label: "Email", placeholder: "email@example.com" },
  { value: "phone", label: "Phone", placeholder: "+1 555-0100" },
  { value: "linkedin_url", label: "LinkedIn", placeholder: "linkedin.com/in/..." },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactCombobox({
  companyId,
  selectedContactIds,
  selectedContacts = [],
  onAdd,
  onRemove,
}: ContactComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod | "">("");
  const [contactValue, setContactValue] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const newContactNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (creating) {
      const timer = setTimeout(() => newContactNameRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [creating]);

  const { data: contacts, isLoading } = useSearchContacts(debouncedTerm, companyId);
  const createContact = useCreateContact();

  // Filter out already-selected contacts
  const availableContacts = contacts?.filter((c) => !selectedContactIds.includes(c.id)) ?? [];

  const hasExactMatch =
    contacts?.some((c) => c.name.toLowerCase() === searchText.toLowerCase()) ?? false;

  const handleSelect = useCallback(
    (contact: Pick<Contact, "id" | "name">) => {
      onAdd(contact);
      setSearchText("");
      setOpen(false);
    },
    [onAdd],
  );

  const handleStartCreate = useCallback(() => {
    setNewName(searchText);
    setNewTitle("");
    setContactMethod("");
    setContactValue("");
    setCreating(true);
  }, [searchText]);

  const handleCreate = useCallback(async () => {
    const input: Record<string, string | null> = {
      name: newName,
      title: newTitle || null,
      company_id: companyId,
      email: null,
      phone: null,
      linkedin_url: null,
    };

    if (contactMethod && contactValue) {
      input[contactMethod] = contactValue;
    }

    const result = await createContact.mutateAsync(
      input as unknown as Parameters<typeof createContact.mutateAsync>[0],
    );
    handleSelect({ id: result.id, name: result.name });
    setCreating(false);
  }, [newName, newTitle, companyId, contactMethod, contactValue, createContact, handleSelect]);

  const handleCancelCreate = useCallback(() => {
    setCreating(false);
  }, []);

  return (
    <div className="space-y-2">
      {/* Selected contacts as chips */}
      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedContacts.map((contact) => (
            <Badge key={contact.id} variant="secondary" className="gap-1">
              {contact.name}
              {onRemove && (
                <button
                  type="button"
                  aria-label={`Remove ${contact.name}`}
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                  onClick={() => onRemove(contact.id)}
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            Search contacts...
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            searchInputRef.current?.focus();
          }}
        >
          <Command shouldFilter={false}>
            <CommandInput
              ref={searchInputRef}
              placeholder="Search by name..."
              value={searchText}
              onValueChange={setSearchText}
            />
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              )}

              {!isLoading && availableContacts.length === 0 && debouncedTerm.length >= 1 && (
                <CommandEmpty>No contacts found.</CommandEmpty>
              )}

              {availableContacts.length > 0 && (
                <CommandGroup>
                  {availableContacts.map((contact) => (
                    <CommandItem
                      key={contact.id}
                      value={contact.id}
                      onSelect={() => handleSelect(contact)}
                    >
                      <Check className="mr-2 size-4 opacity-0" />
                      <div>
                        <span>{contact.name}</span>
                        {contact.title && (
                          <span className="ml-1 text-muted-foreground text-xs">
                            — {contact.title}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchText.length >= 1 && !hasExactMatch && !creating && (
                <CommandGroup>
                  <CommandItem onSelect={handleStartCreate}>
                    <Plus className="mr-2 size-4" />
                    Create &quot;{searchText}&quot;
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Inline create form */}
      {creating && (
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">New Contact</p>
          <div className="space-y-2">
            <Label htmlFor="new-contact-name">Name *</Label>
            <Input
              id="new-contact-name"
              ref={newContactNameRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-contact-title">Title</Label>
            <Input
              id="new-contact-title"
              placeholder="e.g. Engineering Manager"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Contact Method</Label>
            <Select
              value={contactMethod}
              onValueChange={(v) => {
                setContactMethod(v as ContactMethod);
                setContactValue("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method..." />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_METHOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {contactMethod && (
            <div className="space-y-2">
              <Label htmlFor="new-contact-value">
                {CONTACT_METHOD_OPTIONS.find((o) => o.value === contactMethod)?.label}
              </Label>
              <Input
                id="new-contact-value"
                placeholder={
                  CONTACT_METHOD_OPTIONS.find((o) => o.value === contactMethod)?.placeholder
                }
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              disabled={!newName || createContact.isPending}
            >
              {createContact.isPending ? "Creating..." : "Add Contact"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleCancelCreate}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
