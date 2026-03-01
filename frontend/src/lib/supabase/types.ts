export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      application_documents: {
        Row: {
          application_id: string;
          content: string | null;
          document_id: string;
          id: string;
          linked_at: string;
          mime_type: string | null;
          name: string;
          revision: string | null;
          type: string;
          uri: string | null;
        };
        Insert: {
          application_id: string;
          content?: string | null;
          document_id: string;
          id?: string;
          linked_at?: string;
          mime_type?: string | null;
          name: string;
          revision?: string | null;
          type: string;
          uri?: string | null;
        };
        Update: {
          application_id?: string;
          content?: string | null;
          document_id?: string;
          id?: string;
          linked_at?: string;
          mime_type?: string | null;
          name?: string;
          revision?: string | null;
          type?: string;
          uri?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_documents_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          applied_at: string | null;
          archived_at: string | null;
          archived_reason: string | null;
          company_id: string;
          created_at: string;
          employment_type: string | null;
          id: string;
          interest: string | null;
          job_description: string | null;
          locations: string[];
          position: string;
          salary: Json | null;
          source: string | null;
          status: string;
          tags: Json | null;
          updated_at: string;
          url: string | null;
          user_id: string;
          work_type: string | null;
        };
        Insert: {
          applied_at?: string | null;
          archived_at?: string | null;
          archived_reason?: string | null;
          company_id: string;
          created_at?: string;
          employment_type?: string | null;
          id?: string;
          interest?: string | null;
          job_description?: string | null;
          locations?: string[];
          position: string;
          salary?: Json | null;
          source?: string | null;
          status?: string;
          tags?: Json | null;
          updated_at?: string;
          url?: string | null;
          user_id: string;
          work_type?: string | null;
        };
        Update: {
          applied_at?: string | null;
          archived_at?: string | null;
          archived_reason?: string | null;
          company_id?: string;
          created_at?: string;
          employment_type?: string | null;
          id?: string;
          interest?: string | null;
          job_description?: string | null;
          locations?: string[];
          position?: string;
          salary?: Json | null;
          source?: string | null;
          status?: string;
          tags?: Json | null;
          updated_at?: string;
          url?: string | null;
          user_id?: string;
          work_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          archived_at: string | null;
          benefits: string | null;
          cons: string | null;
          created_at: string;
          culture: string | null;
          description: string | null;
          founded: string | null;
          id: string;
          industry: string | null;
          links: Json | null;
          location: string | null;
          name: string;
          pros: string | null;
          ratings: Json | null;
          researched: boolean | null;
          size: string | null;
          tags: Json | null;
          tech_stack: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          benefits?: string | null;
          cons?: string | null;
          created_at?: string;
          culture?: string | null;
          description?: string | null;
          founded?: string | null;
          id?: string;
          industry?: string | null;
          links?: Json | null;
          location?: string | null;
          name: string;
          pros?: string | null;
          ratings?: Json | null;
          researched?: boolean | null;
          size?: string | null;
          tags?: Json | null;
          tech_stack?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          benefits?: string | null;
          cons?: string | null;
          created_at?: string;
          culture?: string | null;
          description?: string | null;
          founded?: string | null;
          id?: string;
          industry?: string | null;
          links?: Json | null;
          location?: string | null;
          name?: string;
          pros?: string | null;
          ratings?: Json | null;
          researched?: boolean | null;
          size?: string | null;
          tags?: Json | null;
          tech_stack?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          company_id: string | null;
          created_at: string;
          email: string | null;
          id: string;
          linkedin_url: string | null;
          name: string;
          notes: string | null;
          phone: string | null;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          linkedin_url?: string | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          linkedin_url?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          archived_at: string | null;
          content: string | null;
          created_at: string;
          id: string;
          mime_type: string | null;
          name: string;
          parent_id: string | null;
          revision: string | null;
          tags: Json | null;
          type: string;
          updated_at: string;
          uri: string | null;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          mime_type?: string | null;
          name: string;
          parent_id?: string | null;
          revision?: string | null;
          tags?: Json | null;
          type?: string;
          updated_at?: string;
          uri?: string | null;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          mime_type?: string | null;
          name?: string;
          parent_id?: string | null;
          revision?: string | null;
          tags?: Json | null;
          type?: string;
          updated_at?: string;
          uri?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      event_contacts: {
        Row: {
          contact_id: string;
          created_at: string;
          event_id: string;
          id: string;
        };
        Insert: {
          contact_id: string;
          created_at?: string;
          event_id: string;
          id?: string;
        };
        Update: {
          contact_id?: string;
          created_at?: string;
          event_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_contacts_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_contacts_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          application_id: string;
          created_at: string;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          notes: string;
          scheduled_at: string | null;
          status: string;
          title: string | null;
          type: string;
          updated_at: string;
          url: string | null;
          user_id: string;
        };
        Insert: {
          application_id: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          notes?: string;
          scheduled_at?: string | null;
          status?: string;
          title?: string | null;
          type: string;
          updated_at?: string;
          url?: string | null;
          user_id: string;
        };
        Update: {
          application_id?: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          notes?: string;
          scheduled_at?: string | null;
          status?: string;
          title?: string | null;
          type?: string;
          updated_at?: string;
          url?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      user_settings: {
        Row: {
          calendar_type: string;
          compact_mode: boolean;
          created_at: string;
          date_format: string;
          email_reminders: boolean;
          language: string;
          notify_backup: boolean;
          notify_deadline: boolean;
          notify_interview: boolean;
          notify_status: boolean;
          show_avatars: boolean;
          theme: string;
          time_format: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          calendar_type?: string;
          compact_mode?: boolean;
          created_at?: string;
          date_format?: string;
          email_reminders?: boolean;
          language?: string;
          notify_backup?: boolean;
          notify_deadline?: boolean;
          notify_interview?: boolean;
          notify_status?: boolean;
          show_avatars?: boolean;
          theme?: string;
          time_format?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          calendar_type?: string;
          compact_mode?: boolean;
          created_at?: string;
          date_format?: string;
          email_reminders?: boolean;
          language?: string;
          notify_backup?: boolean;
          notify_deadline?: boolean;
          notify_interview?: boolean;
          notify_status?: boolean;
          show_avatars?: boolean;
          theme?: string;
          time_format?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_dashboard_stats: { Args: never; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
