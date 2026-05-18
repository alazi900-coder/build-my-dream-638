export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      encounters: {
        Row: {
          id: number;
          pokemon_id: number;
          location_id: number;
          method: string;
          min_lvl: number;
          max_lvl: number;
          chance: number;
          time_of_day: string | null;
          weather: string | null;
          version: string | null;
        };
        Insert: {
          id?: number;
          pokemon_id: number;
          location_id: number;
          method?: string;
          min_lvl?: number;
          max_lvl?: number;
          chance?: number;
          time_of_day?: string | null;
          weather?: string | null;
          version?: string | null;
        };
        Update: {
          id?: number;
          pokemon_id?: number;
          location_id?: number;
          method?: string;
          min_lvl?: number;
          max_lvl?: number;
          chance?: number;
          time_of_day?: string | null;
          weather?: string | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "encounters_pokemon_id_fkey";
            columns: ["pokemon_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounters_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
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
          id: string;
          name_en: string;
          name_ar: string | null;
        };
        Insert: {
          id: string;
          name_en: string;
          name_ar?: string | null;
        };
        Update: {
          id?: string;
          name_en?: string;
          name_ar?: string | null;
        };
        Relationships: [];
      };
      gym_roster: {
        Row: {
          id: number;
          gym_id: number;
          pokemon_id: number;
          level: number;
          moves: Json;
        };
        Insert: {
          id?: number;
          gym_id: number;
          pokemon_id: number;
          level?: number;
          moves?: Json;
        };
        Update: {
          id?: number;
          gym_id?: number;
          pokemon_id?: number;
          level?: number;
          moves?: Json;
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
          id: number;
          game_id: string | null;
          city_en: string;
          city_ar: string | null;
          leader_name_en: string;
          leader_name_ar: string | null;
          type: string;
          challenge_en: string | null;
          challenge_ar: string | null;
          tips_en: string | null;
          tips_ar: string | null;
          badge_order: number;
          available_in: string[] | null;
        };
        Insert: {
          id: number;
          game_id?: string | null;
          city_en: string;
          city_ar?: string | null;
          leader_name_en: string;
          leader_name_ar?: string | null;
          type?: string;
          challenge_en?: string | null;
          challenge_ar?: string | null;
          tips_en?: string | null;
          tips_ar?: string | null;
          badge_order?: number;
          available_in?: string[] | null;
        };
        Update: {
          id?: number;
          game_id?: string | null;
          city_en?: string;
          city_ar?: string | null;
          leader_name_en?: string;
          leader_name_ar?: string | null;
          type?: string;
          challenge_en?: string | null;
          challenge_ar?: string | null;
          tips_en?: string | null;
          tips_ar?: string | null;
          badge_order?: number;
          available_in?: string[] | null;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: number;
          name_en: string;
          name_ar: string | null;
          category: string;
          effect_en: string | null;
          effect_ar: string | null;
          usage_en: string | null;
          usage_ar: string | null;
          obtain: Json;
          available_in: string[] | null;
        };
        Insert: {
          id: number;
          name_en: string;
          name_ar?: string | null;
          category?: string;
          effect_en?: string | null;
          effect_ar?: string | null;
          usage_en?: string | null;
          usage_ar?: string | null;
          obtain?: Json;
          available_in?: string[] | null;
        };
        Update: {
          id?: number;
          name_en?: string;
          name_ar?: string | null;
          category?: string;
          effect_en?: string | null;
          effect_ar?: string | null;
          usage_en?: string | null;
          usage_ar?: string | null;
          obtain?: Json;
          available_in?: string[] | null;
        };
        Relationships: [];
      };
      learnsets: {
        Row: {
          id: number;
          pokemon_id: number;
          move_id: number;
          level: number | null;
          learn_method: string;
          game_id: string;
        };
        Insert: {
          id?: number;
          pokemon_id: number;
          move_id: number;
          level?: number | null;
          learn_method?: string;
          game_id?: string;
        };
        Update: {
          id?: number;
          pokemon_id?: number;
          move_id?: number;
          level?: number | null;
          learn_method?: string;
          game_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learnsets_pokemon_id_fkey";
            columns: ["pokemon_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learnsets_move_id_fkey";
            columns: ["move_id"];
            isOneToOne: false;
            referencedRelation: "moves";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          id: number;
          name_en: string;
          name_ar: string | null;
          region: string;
          map_data: Json;
          notes_en: string | null;
          notes_ar: string | null;
          map_image_url: string | null;
          available_in: string[] | null;
        };
        Insert: {
          id: number;
          name_en: string;
          name_ar?: string | null;
          region?: string;
          map_data?: Json;
          notes_en?: string | null;
          notes_ar?: string | null;
          map_image_url?: string | null;
          available_in?: string[] | null;
        };
        Update: {
          id?: number;
          name_en?: string;
          name_ar?: string | null;
          region?: string;
          map_data?: Json;
          notes_en?: string | null;
          notes_ar?: string | null;
          map_image_url?: string | null;
          available_in?: string[] | null;
        };
        Relationships: [];
      };
      moves: {
        Row: {
          id: number;
          name_en: string;
          name_ar: string | null;
          type: string;
          category: string;
          power: number | null;
          accuracy: number | null;
          pp: number;
          effect_en: string | null;
          effect_ar: string | null;
          learnset: Json | null;
          available_in: string[] | null;
        };
        Insert: {
          id: number;
          name_en: string;
          name_ar?: string | null;
          type?: string;
          category?: string;
          power?: number | null;
          accuracy?: number | null;
          pp?: number;
          effect_en?: string | null;
          effect_ar?: string | null;
          learnset?: Json | null;
          available_in?: string[] | null;
        };
        Update: {
          id?: number;
          name_en?: string;
          name_ar?: string | null;
          type?: string;
          category?: string;
          power?: number | null;
          accuracy?: number | null;
          pp?: number;
          effect_en?: string | null;
          effect_ar?: string | null;
          learnset?: Json | null;
          available_in?: string[] | null;
        };
        Relationships: [];
      };
      npcs: {
        Row: {
          id: number;
          name_en: string;
          name_ar: string | null;
          role_en: string;
          role_ar: string | null;
          category: string;
          location_en: string;
          location_ar: string | null;
          story_en: string | null;
          story_ar: string | null;
          image_url: string | null;
          badge_order: number | null;
          specialty_type: string | null;
        };
        Insert: {
          id: number;
          name_en: string;
          name_ar?: string | null;
          role_en?: string;
          role_ar?: string | null;
          category?: string;
          location_en?: string;
          location_ar?: string | null;
          story_en?: string | null;
          story_ar?: string | null;
          image_url?: string | null;
          badge_order?: number | null;
          specialty_type?: string | null;
        };
        Update: {
          id?: number;
          name_en?: string;
          name_ar?: string | null;
          role_en?: string;
          role_ar?: string | null;
          category?: string;
          location_en?: string;
          location_ar?: string | null;
          story_en?: string | null;
          story_ar?: string | null;
          image_url?: string | null;
          badge_order?: number | null;
          specialty_type?: string | null;
        };
        Relationships: [];
      };
      pokemon_held_items: {
        Row: {
          id: number;
          pokemon_id: number;
          item_id: number;
          hold_chance: number;
          game_id: string;
        };
        Insert: {
          id?: number;
          pokemon_id: number;
          item_id: number;
          hold_chance?: number;
          game_id?: string;
        };
        Update: {
          id?: number;
          pokemon_id?: number;
          item_id?: number;
          hold_chance?: number;
          game_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "held_items_pokemon_id_fkey";
            columns: ["pokemon_id"];
            isOneToOne: false;
            referencedRelation: "pokemon";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "held_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      pokemon: {
        Row: {
          abilities: Json;
          artwork_url: string | null;
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
