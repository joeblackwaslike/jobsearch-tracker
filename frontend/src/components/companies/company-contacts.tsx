import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  type Contact,
} from "@/lib/queries/contacts";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MailIcon,
  PhoneIcon,
  LinkIcon,
  XIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompanyContactsProps {
  companyId: string;
}

interface ContactFormData {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin_url: string;
  notes: string;
}

const emptyForm: ContactFormData = {
  name: "",
  title: "",
  email: "",
  phone: "",
  linkedin_url: "",
  notes: "",
};

// ---------------------------------------------------------------------------
// Contact Form (inline)
// ---------------------------------------------------------------------------

function ContactForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial: ContactFormData;
  onSubmit: (data: ContactFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<ContactFormData>(initial);

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  return (
    <div className="rounded-md border p-3 space-y-3 bg-muted/30">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="contact-name" className="text-xs">
            Name *
          </Label>
          <Input
            id="contact-name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Full name"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-title" className="text-xs">
            Title
          </Label>
          <Input
            id="contact-title"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Job title"
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="contact-email" className="text-xs">
            Email
          </Label>
          <Input
            id="contact-email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="email@example.com"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-phone" className="text-xs">
            Phone
          </Label>
          <Input
            id="contact-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="contact-linkedin" className="text-xs">
          LinkedIn URL
        </Label>
        <Input
          id="contact-linkedin"
          value={form.linkedin_url}
          onChange={(e) => handleChange("linkedin_url", e.target.value)}
          placeholder="https://linkedin.com/in/..."
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="contact-notes" className="text-xs">
          Notes
        </Label>
        <textarea
          id="contact-notes"
          value={form.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Any notes about this contact..."
          className="flex min-h-[48px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isPending || !form.name.trim()}
          onClick={handleSubmit}
        >
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact Row
// ---------------------------------------------------------------------------

function ContactRow({
  contact,
  onEdit,
  onDelete,
  isDeleting,
}: {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{contact.name}</span>
          {contact.title && (
            <span className="text-xs text-muted-foreground truncate">
              {contact.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              title={contact.email}
            >
              <MailIcon className="h-3 w-3" />
              <span className="truncate max-w-[140px]">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              title={contact.phone}
            >
              <PhoneIcon className="h-3 w-3" />
              <span>{contact.phone}</span>
            </a>
          )}
          {contact.linkedin_url && (
            <a
              href={contact.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              title="LinkedIn"
            >
              <LinkIcon className="h-3 w-3" />
              <span>LinkedIn</span>
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onEdit}
          title="Edit contact"
        >
          <PencilIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={isDeleting}
          title="Delete contact"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CompanyContacts({ companyId }: CompanyContactsProps) {
  const { data: contacts = [], isLoading } = useContacts(companyId);
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = async (data: ContactFormData) => {
    await createContact.mutateAsync({
      company_id: companyId,
      name: data.name,
      title: data.title || null,
      email: data.email || null,
      phone: data.phone || null,
      linkedin_url: data.linkedin_url || null,
      notes: data.notes || null,
    });
    setShowAddForm(false);
  };

  const handleUpdate = async (id: string, data: ContactFormData) => {
    await updateContact.mutateAsync({
      id,
      name: data.name,
      title: data.title || null,
      email: data.email || null,
      phone: data.phone || null,
      linkedin_url: data.linkedin_url || null,
      notes: data.notes || null,
    });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteContact.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        Loading contacts...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contacts.length === 0 && !showAddForm && (
        <p className="text-sm text-muted-foreground py-1">No contacts yet</p>
      )}

      {contacts.map((contact) =>
        editingId === contact.id ? (
          <ContactForm
            key={contact.id}
            initial={{
              name: contact.name,
              title: contact.title ?? "",
              email: contact.email ?? "",
              phone: contact.phone ?? "",
              linkedin_url: contact.linkedin_url ?? "",
              notes: contact.notes ?? "",
            }}
            onSubmit={(data) => handleUpdate(contact.id, data)}
            onCancel={() => setEditingId(null)}
            isPending={updateContact.isPending}
          />
        ) : (
          <ContactRow
            key={contact.id}
            contact={contact}
            onEdit={() => setEditingId(contact.id)}
            onDelete={() => handleDelete(contact.id)}
            isDeleting={deleteContact.isPending}
          />
        )
      )}

      {showAddForm && (
        <ContactForm
          initial={emptyForm}
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
          isPending={createContact.isPending}
        />
      )}

      {!showAddForm && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Contact
        </Button>
      )}
    </div>
  );
}
