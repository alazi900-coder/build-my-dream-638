export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      comparison_presets: {
        Row: {
          created_at: string | null;
          game_id: string;
          id: string;
          name: string;
          pokemon_a_id: number;
          pokemon_a_level: number;
          pokemon_a_moves: Json | null;
          pokemon_b_id: number;
          pokemon_b_level: number;
          pokemon_b_moves: Json | null;
        };
        Insert: {
          created_at?: string | null;
          game_id?: string;
          id?: string;
          name: string;
          pokemon_a_id: number;
          pokemon_a_level?: number;
          pokemon_a_moves?: Json | null;
          pokemon_b_id: number;
          pokemon_b_level?: number;
          pokemon_b_moves?: Json | null;
        };
        Update: {
          created_at?: string | null;
          game_id?: string;
          id?: string;
          name?: string;
          pokemon_a_id?: number;
          pokemon_a_level?: number;
          pokemon_a_moves?: Json | null;
          pokemon_b_id?: number;
          pokemon_b_level?: number;
          pokemon_b_moves?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_game";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_pokemon_a";
            columns: ["pokemon_a_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_pokemon_b";
            columns: ["pokemon_b_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
        ];
      };
      encounters: {
        Row: {
          available_in: Json | null;
          chance: number | null;
          created_at: string | null;
          game_id: string | null;
          id: number;
          location_id: number;
          max_lvl: number;
          method: string;
          min_lvl: number;
          pokemon_id: number;
          time_of_day: string | null;
          version: string | null;
          weather: string | null;
        };
        Insert: {
          available_in?: Json | null;
          chance?: number | null;
          created_at?: string | null;
          game_id?: string | null;
          id?: number;
          location_id: number;
          max_lvl?: number;
          method: string;
          min_lvl?: number;
          pokemon_id: number;
          time_of_day?: string | null;
          version?: string | null;
          weather?: string | null;
        };
        Update: {
          available_in?: Json | null;
          chance?: number | null;
          created_at?: string | null;
          game_id?: string | null;
          id?: number;
          location_id?: number;
          max_lvl?: number;
          method?: string;
          min_lvl?: number;
          pokemon_id?: number;
          time_of_day?: string | null;
          version?: string | null;
          weather?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "encounters_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounters_pokemon_id_fkey";
            columns: ["pokemon_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
        ];
      };
      evolution_nodes: {
        Row: {
          conditions_ar: string | null;
          conditions_en: string | null;
          created_at: string | null;
          evolves_to_pokemon_id: number;
          game_id: string | null;
          id: number;
          item_id: number | null;
          level: number | null;
          method_type: string;
          pokemon_id: number;
        };
        Insert: {
          conditions_ar?: string | null;
          conditions_en?: string | null;
          created_at?: string | null;
          evolves_to_pokemon_id: number;
          game_id?: string | null;
          id?: number;
          item_id?: number | null;
          level?: number | null;
          method_type?: string;
          pokemon_id: number;
        };
        Update: {
          conditions_ar?: string | null;
          conditions_en?: string | null;
          created_at?: string | null;
          evolves_to_pokemon_id?: number;
          game_id?: string | null;
          id?: number;
          item_id?: number | null;
          level?: number | null;
          method_type?: string;
          pokemon_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_evolves_to";
            columns: ["evolves_to_pokemon_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_game";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_item";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_pokemon";
            columns: ["pokemon_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          created_at: string | null;
          id: string;
          name_ar: string;
          name_en: string;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          name_ar: string;
          name_en: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name_ar?: string;
          name_en?: string;
        };
        Relationships: [];
      };
      gym_roster: {
        Row: {
          created_at: string | null;
          gym_id: number;
          id: number;
          level: number;
          moves: Json | null;
          pokemon_id: number;
        };
        Insert: {
          created_at?: string | null;
          gym_id: number;
          id?: number;
          level?: number;
          moves?: Json | null;
          pokemon_id: number;
        };
        Update: {
          created_at?: string | null;
          gym_id?: number;
          id?: number;
          level?: number;
          moves?: Json | null;
          pokemon_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "gym_roster_gym_id_fkey";
            columns: ["gym_id"];
            isOneToOne: false;
            referencedRelation: "gyms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gym_roster_pokemon_id_fkey";
            columns: ["pokemon_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
        ];
      };
      gyms: {
        Row: {
          available_in: Json | null;
          badge_order: number | null;
          challenge_ar: string | null;
          challenge_en: string | null;
          city_ar: string;
          city_en: string;
          created_at: string | null;
          game_id: string | null;
          id: number;
          leader_name_ar: string;
          leader_name_en: string;
          tips_ar: string | null;
          tips_en: string | null;
          type: string;
        };
        Insert: {
          available_in?: Json | null;
          badge_order?: number | null;
          challenge_ar?: string | null;
          challenge_en?: string | null;
          city_ar: string;
          city_en: string;
          created_at?: string | null;
          game_id?: string | null;
          id?: number;
          leader_name_ar: string;
          leader_name_en: string;
          tips_ar?: string | null;
          tips_en?: string | null;
          type: string;
        };
        Update: {
          available_in?: Json | null;
          badge_order?: number | null;
          challenge_ar?: string | null;
          challenge_en?: string | null;
          city_ar?: string;
          city_en?: string;
          created_at?: string | null;
          game_id?: string | null;
          id?: number;
          leader_name_ar?: string;
          leader_name_en?: string;
          tips_ar?: string | null;
          tips_en?: string | null;
          type?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          available_in: Json | null;
          category: string;
          created_at: string | null;
          effect_ar: string | null;
          effect_en: string | null;
          id: number;
          name_ar: string;
          name_en: string;
          obtain: Json | null;
          usage_ar: string | null;
          usage_en: string | null;
        };
        Insert: {
          available_in?: Json | null;
          category: string;
          created_at?: string | null;
          effect_ar?: string | null;
          effect_en?: string | null;
          id?: number;
          name_ar: string;
          name_en: string;
          obtain?: Json | null;
          usage_ar?: string | null;
          usage_en?: string | null;
        };
        Update: {
          available_in?: Json | null;
          category?: string;
          created_at?: string | null;
          effect_ar?: string | null;
          effect_en?: string | null;
          id?: number;
          name_ar?: string;
          name_en?: string;
          obtain?: Json | null;
          usage_ar?: string | null;
          usage_en?: string | null;
        };
        Relationships: [];
      };
      learnsets: {
        Row: {
          created_at: string | null;
          game_id: string;
          id: number;
          learn_method: string;
          level: number | null;
          move_id: number;
          pokemon_id: number;
        };
        Insert: {
          created_at?: string | null;
          game_id: string;
          id?: number;
          learn_method?: string;
          level?: number | null;
          move_id: number;
          pokemon_id: number;
        };
        Update: {
          created_at?: string | null;
          game_id?: string;
          id?: number;
          learn_method?: string;
          level?: number | null;
          move_id?: number;
          pokemon_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_game";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_move";
            columns: ["move_id"];
            isOneToOne: false;
            referencedRelation: "moves";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_pokemon";
            columns: ["pokemon_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          available_in: Json | null;
          created_at: string | null;
          game_id: string | null;
          id: number;
          map_data: Json | null;
          name_ar: string;
          name_en: string;
          notes_ar: string | null;
          notes_en: string | null;
          region: string;
        };
        Insert: {
          available_in?: Json | null;
          created_at?: string | null;
          game_id?: string | null;
          id?: number;
          map_data?: Json | null;
          name_ar: string;
          name_en: string;
          notes_ar?: string | null;
          notes_en?: string | null;
          region?: string;
        };
        Update: {
          available_in?: Json | null;
          created_at?: string | null;
          game_id?: string | null;
          id?: number;
          map_data?: Json | null;
          name_ar?: string;
          name_en?: string;
          notes_ar?: string | null;
          notes_en?: string | null;
          region?: string;
        };
        Relationships: [];
      };
      moves: {
        Row: {
          accuracy: number | null;
          available_in: Json | null;
          category: string;
          created_at: string | null;
          effect_ar: string | null;
          effect_en: string | null;
          id: number;
          learnset: Json | null;
          name_ar: string;
          name_en: string;
          power: number | null;
          pp: number;
          type: string;
        };
        Insert: {
          accuracy?: number | null;
          available_in?: Json | null;
          category: string;
          created_at?: string | null;
          effect_ar?: string | null;
          effect_en?: string | null;
          id?: number;
          learnset?: Json | null;
          name_ar: string;
          name_en: string;
          power?: number | null;
          pp: number;
          type: string;
        };
        Update: {
          accuracy?: number | null;
          available_in?: Json | null;
          category?: string;
          created_at?: string | null;
          effect_ar?: string | null;
          effect_en?: string | null;
          id?: number;
          learnset?: Json | null;
          name_ar?: string;
          name_en?: string;
          power?: number | null;
          pp?: number;
          type?: string;
        };
        Relationships: [];
      };
      npcs: {
        Row: {
          badge_order: number | null;
          category: string;
          created_at: string | null;
          id: number;
          image_url: string | null;
          location_ar: string;
          location_en: string;
          name_ar: string;
          name_en: string;
          role_ar: string;
          role_en: string;
          specialty_type: string | null;
          story_ar: string | null;
          story_en: string | null;
        };
        Insert: {
          badge_order?: number | null;
          category: string;
          created_at?: string | null;
          id?: number;
          image_url?: string | null;
          location_ar: string;
          location_en: string;
          name_ar: string;
          name_en: string;
          role_ar: string;
          role_en: string;
          specialty_type?: string | null;
          story_ar?: string | null;
          story_en?: string | null;
        };
        Update: {
          badge_order?: number | null;
          category?: string;
          created_at?: string | null;
          id?: number;
          image_url?: string | null;
          location_ar?: string;
          location_en?: string;
          name_ar?: string;
          name_en?: string;
          role_ar?: string;
          role_en?: string;
          specialty_type?: string | null;
          story_ar?: string | null;
          story_en?: string | null;
        };
        Relationships: [];
      };
      pokemon: {
        Row: {
          abilities: Json;
          available_in: Json | null;
          created_at: string | null;
          evolution: Json | null;
          id: number;
          is_legendary: boolean | null;
          is_starter: boolean | null;
          name_ar: string;
          name_en: string;
          notes_ar: string | null;
          notes_en: string | null;
          stats: Json;
          tags: Json | null;
          types: Json;
        };
        Insert: {
          abilities?: Json;
          available_in?: Json | null;
          created_at?: string | null;
          evolution?: Json | null;
          id?: number;
          is_legendary?: boolean | null;
          is_starter?: boolean | null;
          name_ar: string;
          name_en: string;
          notes_ar?: string | null;
          notes_en?: string | null;
          stats?: Json;
          tags?: Json | null;
          types?: Json;
        };
        Update: {
          abilities?: Json;
          available_in?: Json | null;
          created_at?: string | null;
          evolution?: Json | null;
          id?: number;
          is_legendary?: boolean | null;
          is_starter?: boolean | null;
          name_ar?: string;
          name_en?: string;
          notes_ar?: string | null;
          notes_en?: string | null;
          stats?: Json;
          tags?: Json | null;
          types?: Json;
        };
        Relationships: [];
      };
      pokemon_held_items: {
        Row: {
          created_at: string | null;
          game_id: string | null;
          hold_chance: number | null;
          id: number;
          item_id: number;
          pokemon_id: number;
        };
        Insert: {
          created_at?: string | null;
          game_id?: string | null;
          hold_chance?: number | null;
          id?: number;
          item_id: number;
          pokemon_id: number;
        };
        Update: {
          created_at?: string | null;
          game_id?: string | null;
          hold_chance?: number | null;
          id?: number;
          item_id?: number;
          pokemon_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pokemon_held_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pokemon_held_items_pokemon_id_fkey";
            columns: ["pokemon_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
        ];
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
