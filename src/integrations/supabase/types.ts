export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      comparison_presets: {
        Row: {
          created_at: string;
          game_id: string | null;
          id: string;
          name: string;
          pokemon_a_id: number | null;
          pokemon_a_level: number | null;
          pokemon_a_moves: Json | null;
          pokemon_b_id: number | null;
          pokemon_b_level: number | null;
          pokemon_b_moves: Json | null;
        };
        Insert: {
          created_at?: string;
          game_id?: string | null;
          id?: string;
          name: string;
          pokemon_a_id?: number | null;
          pokemon_a_level?: number | null;
          pokemon_a_moves?: Json | null;
          pokemon_b_id?: number | null;
          pokemon_b_level?: number | null;
          pokemon_b_moves?: Json | null;
        };
        Update: {
          created_at?: string;
          game_id?: string | null;
          id?: string;
          name?: string;
          pokemon_a_id?: number | null;
          pokemon_a_level?: number | null;
          pokemon_a_moves?: Json | null;
          pokemon_b_id?: number | null;
          pokemon_b_level?: number | null;
          pokemon_b_moves?: Json | null;
        };
        Relationships: [];
      };
      encounters: {
        Row: {
          created_at: string;
          game_id: string | null;
          id: number;
          location_id: number | null;
          max_level: number | null;
          method: string | null;
          min_level: number | null;
          pokemon_id: number | null;
          rate: number | null;
        };
        Insert: {
          created_at?: string;
          game_id?: string | null;
          id?: number;
          location_id?: number | null;
          max_level?: number | null;
          method?: string | null;
          min_level?: number | null;
          pokemon_id?: number | null;
          rate?: number | null;
        };
        Update: {
          created_at?: string;
          game_id?: string | null;
          id?: number;
          location_id?: number | null;
          max_level?: number | null;
          method?: string | null;
          min_level?: number | null;
          pokemon_id?: number | null;
          rate?: number | null;
        };
        Relationships: [];
      };
      evolution_nodes: {
        Row: {
          chain_id: number;
          condition: Json | null;
          from_pokemon_id: number;
          id: number;
          item: string | null;
          min_level: number | null;
          to_pokemon_id: number;
          trigger: string | null;
        };
        Insert: {
          chain_id: number;
          condition?: Json | null;
          from_pokemon_id: number;
          id?: number;
          item?: string | null;
          min_level?: number | null;
          to_pokemon_id: number;
          trigger?: string | null;
        };
        Update: {
          chain_id?: number;
          condition?: Json | null;
          from_pokemon_id?: number;
          id?: number;
          item?: string | null;
          min_level?: number | null;
          to_pokemon_id?: number;
          trigger?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "evolution_nodes_from_pokemon_id_fkey";
            columns: ["from_pokemon_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evolution_nodes_to_pokemon_id_fkey";
            columns: ["to_pokemon_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          created_at: string;
          id: string;
          name_ar: string | null;
          name_en: string | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          name_ar?: string | null;
          name_en?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name_ar?: string | null;
          name_en?: string | null;
        };
        Relationships: [];
      };
      gym_roster: {
        Row: {
          created_at: string;
          game_id: string | null;
          gym_id: number | null;
          id: number;
          level: number | null;
          moves: Json | null;
          pokemon_id: number | null;
        };
        Insert: {
          created_at?: string;
          game_id?: string | null;
          gym_id?: number | null;
          id?: number;
          level?: number | null;
          moves?: Json | null;
          pokemon_id?: number | null;
        };
        Update: {
          created_at?: string;
          game_id?: string | null;
          gym_id?: number | null;
          id?: number;
          level?: number | null;
          moves?: Json | null;
          pokemon_id?: number | null;
        };
        Relationships: [];
      };
      gyms: {
        Row: {
          available_in: string[] | null;
          badge_order: number | null;
          challenge_ar: string | null;
          challenge_en: string | null;
          city_ar: string | null;
          city_en: string | null;
          created_at: string;
          id: number;
          leader_name_ar: string | null;
          leader_name_en: string | null;
          tips_ar: string | null;
          tips_en: string | null;
          type: string | null;
        };
        Insert: {
          available_in?: string[] | null;
          badge_order?: number | null;
          challenge_ar?: string | null;
          challenge_en?: string | null;
          city_ar?: string | null;
          city_en?: string | null;
          created_at?: string;
          id: number;
          leader_name_ar?: string | null;
          leader_name_en?: string | null;
          tips_ar?: string | null;
          tips_en?: string | null;
          type?: string | null;
        };
        Update: {
          available_in?: string[] | null;
          badge_order?: number | null;
          challenge_ar?: string | null;
          challenge_en?: string | null;
          city_ar?: string | null;
          city_en?: string | null;
          created_at?: string;
          id?: number;
          leader_name_ar?: string | null;
          leader_name_en?: string | null;
          tips_ar?: string | null;
          tips_en?: string | null;
          type?: string | null;
        };
        Relationships: [];
      };
      items: {
        Row: {
          available_in: string[] | null;
          category: string | null;
          created_at: string;
          effect_ar: string | null;
          effect_en: string | null;
          id: number;
          name_ar: string | null;
          name_en: string;
          obtain: Json | null;
          sprite_url: string | null;
          usage_ar: string | null;
          usage_en: string | null;
        };
        Insert: {
          available_in?: string[] | null;
          category?: string | null;
          created_at?: string;
          effect_ar?: string | null;
          effect_en?: string | null;
          id: number;
          name_ar?: string | null;
          name_en: string;
          obtain?: Json | null;
          sprite_url?: string | null;
          usage_ar?: string | null;
          usage_en?: string | null;
        };
        Update: {
          available_in?: string[] | null;
          category?: string | null;
          created_at?: string;
          effect_ar?: string | null;
          effect_en?: string | null;
          id?: number;
          name_ar?: string | null;
          name_en?: string;
          obtain?: Json | null;
          sprite_url?: string | null;
          usage_ar?: string | null;
          usage_en?: string | null;
        };
        Relationships: [];
      };
      learnsets: {
        Row: {
          created_at: string;
          game_id: string | null;
          id: number;
          level: number | null;
          method: string | null;
          move_id: number | null;
          pokemon_id: number | null;
        };
        Insert: {
          created_at?: string;
          game_id?: string | null;
          id?: number;
          level?: number | null;
          method?: string | null;
          move_id?: number | null;
          pokemon_id?: number | null;
        };
        Update: {
          created_at?: string;
          game_id?: string | null;
          id?: number;
          level?: number | null;
          method?: string | null;
          move_id?: number | null;
          pokemon_id?: number | null;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          available_in: string[] | null;
          created_at: string;
          id: number;
          map_data: Json | null;
          map_image_url: string | null;
          name_ar: string | null;
          name_en: string;
          notes_ar: string | null;
          notes_en: string | null;
          region: string | null;
        };
        Insert: {
          available_in?: string[] | null;
          created_at?: string;
          id: number;
          map_data?: Json | null;
          map_image_url?: string | null;
          name_ar?: string | null;
          name_en: string;
          notes_ar?: string | null;
          notes_en?: string | null;
          region?: string | null;
        };
        Update: {
          available_in?: string[] | null;
          created_at?: string;
          id?: number;
          map_data?: Json | null;
          map_image_url?: string | null;
          name_ar?: string | null;
          name_en?: string;
          notes_ar?: string | null;
          notes_en?: string | null;
          region?: string | null;
        };
        Relationships: [];
      };
      moves: {
        Row: {
          accuracy: number | null;
          available_in: string[] | null;
          category: string | null;
          created_at: string;
          effect_ar: string | null;
          effect_en: string | null;
          id: number;
          name_ar: string | null;
          name_en: string;
          power: number | null;
          pp: number | null;
          type: string | null;
        };
        Insert: {
          accuracy?: number | null;
          available_in?: string[] | null;
          category?: string | null;
          created_at?: string;
          effect_ar?: string | null;
          effect_en?: string | null;
          id: number;
          name_ar?: string | null;
          name_en: string;
          power?: number | null;
          pp?: number | null;
          type?: string | null;
        };
        Update: {
          accuracy?: number | null;
          available_in?: string[] | null;
          category?: string | null;
          created_at?: string;
          effect_ar?: string | null;
          effect_en?: string | null;
          id?: number;
          name_ar?: string | null;
          name_en?: string;
          power?: number | null;
          pp?: number | null;
          type?: string | null;
        };
        Relationships: [];
      };
      npcs: {
        Row: {
          available_in: string[] | null;
          created_at: string;
          game_id: string | null;
          id: number;
          image_url: string | null;
          location_id: number | null;
          name_ar: string | null;
          name_en: string | null;
          role_ar: string | null;
          role_en: string | null;
        };
        Insert: {
          available_in?: string[] | null;
          created_at?: string;
          game_id?: string | null;
          id?: number;
          image_url?: string | null;
          location_id?: number | null;
          name_ar?: string | null;
          name_en?: string | null;
          role_ar?: string | null;
          role_en?: string | null;
        };
        Update: {
          available_in?: string[] | null;
          created_at?: string;
          game_id?: string | null;
          id?: number;
          image_url?: string | null;
          location_id?: number | null;
          name_ar?: string | null;
          name_en?: string | null;
          role_ar?: string | null;
          role_en?: string | null;
        };
        Relationships: [];
      };
      pokemon: {
        Row: {
          abilities: Json;
          artwork_url: string | null;
          available_in: string[] | null;
          created_at: string;
          description_ar: string | null;
          description_en: string | null;
          evolution_chain_id: number | null;
          generation: number;
          height: number;
          id: number;
          name_ar: string | null;
          name_en: string;
          sprite_url: string | null;
          stats: Json;
          types: string[];
          weight: number;
        };
        Insert: {
          abilities?: Json;
          artwork_url?: string | null;
          available_in?: string[] | null;
          created_at?: string;
          description_ar?: string | null;
          description_en?: string | null;
          evolution_chain_id?: number | null;
          generation?: number;
          height?: number;
          id: number;
          name_ar?: string | null;
          name_en: string;
          sprite_url?: string | null;
          stats?: Json;
          types?: string[];
          weight?: number;
        };
        Update: {
          abilities?: Json;
          artwork_url?: string | null;
          available_in?: string[] | null;
          created_at?: string;
          description_ar?: string | null;
          description_en?: string | null;
          evolution_chain_id?: number | null;
          generation?: number;
          height?: number;
          id?: number;
          name_ar?: string | null;
          name_en?: string;
          sprite_url?: string | null;
          stats?: Json;
          types?: string[];
          weight?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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
  public: {
    Enums: {},
  },
} as const;
