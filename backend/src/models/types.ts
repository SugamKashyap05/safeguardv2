export interface Parent {
    id: string;
    email: string;
    name: string;
    phone_number?: string;
    subscription_tier: 'free' | 'premium' | 'family';
    is_active: boolean;
    notification_preferences: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    created_at: string;
    updated_at: string;
}

export interface Child {
    id: string;
    parent_id: string;
    name: string;
    age: number; // 3-10
    avatar?: string;
    pin_hash: string;
    age_appropriate_level: 'preschool' | 'early-elementary' | 'elementary';
    preferences: {
        favoriteCategories: string[];
        favoriteChannels: string[];
    };
    is_active: boolean;
    paused_until?: string;
    pause_reason?: string;
    created_at: string;
    updated_at: string;
}
