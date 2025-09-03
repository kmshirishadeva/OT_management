export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          contact: string
          created_at: string | null
          employee_id: string
          id: string
          name: string
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          contact: string
          created_at?: string | null
          employee_id: string
          id?: string
          name: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          contact?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          notes: string | null
          operation_theater: number | null
          patient_id: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          notes?: string | null
          operation_theater?: number | null
          patient_id: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          operation_theater?: number | null
          patient_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          contact: string
          created_at: string
          employee_id: string
          id: string
          name: string
          qualification: string
          role: Database["public"]["Enums"]["user_role"]
          specialization: Database["public"]["Enums"]["specialization"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact: string
          created_at?: string
          employee_id: string
          id?: string
          name: string
          qualification: string
          role?: Database["public"]["Enums"]["user_role"]
          specialization: Database["public"]["Enums"]["specialization"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact?: string
          created_at?: string
          employee_id?: string
          id?: string
          name?: string
          qualification?: string
          role?: Database["public"]["Enums"]["user_role"]
          specialization?: Database["public"]["Enums"]["specialization"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: number
          condition: string
          created_at: string
          id: string
          name: string
          patient_id: string
          updated_at: string
          gender: string | null
          emergency_contact: string | null
          medical_history: string | null
          icu_days: number | null
          expected_hospital_stay: number | null
          insurance: string | null
          instruments: string | null
          date_of_admission: string | null
          date_of_discharge: string | null
          sms_service: boolean | null
        }
        Insert: {
          age: number
          condition: string
          created_at?: string
          id?: string
          name: string
          patient_id: string
          updated_at?: string
          gender?: string | null
          emergency_contact?: string | null
          medical_history?: string | null
          icu_days?: number | null
          expected_hospital_stay?: number | null
          insurance?: string | null
          instruments?: string | null
          date_of_admission?: string | null
          date_of_discharge?: string | null
          sms_service?: boolean | null
        }
        Update: {
          age?: number
          condition?: string
          created_at?: string
          id?: string
          name?: string
          patient_id?: string
          updated_at?: string
          gender?: string | null
          emergency_contact?: string | null
          medical_history?: string | null
          icu_days?: number | null
          expected_hospital_stay?: number | null
          insurance?: string | null
          instruments?: string | null
          date_of_admission?: string | null
          date_of_discharge?: string | null
          sms_service?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_booking_conflict: {
        Args: {
          p_booking_date: string
          p_booking_id?: string
          p_end_time: string
          p_start_time: string
        }
        Returns: boolean
      }
      get_current_admin_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_doctor_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      booking_status: "booked" | "cancelled" | "completed"
      specialization:
        | "surgeon"
        | "orthopedic"
        | "neuro"
        | "cardiac"
        | "general"
        | "pediatric"
        | "gynecology"
        | "ent"
        | "ophthalmology"
        | "anesthesiology"
      user_role: "doctor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: ["booked", "cancelled", "completed"],
      specialization: [
        "surgeon",
        "orthopedic",
        "neuro",
        "cardiac",
        "general",
        "pediatric",
        "gynecology",
        "ent",
        "ophthalmology",
        "anesthesiology",
      ],
      user_role: ["doctor", "admin"],
    },
  },
} as const
