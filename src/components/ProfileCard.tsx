import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, User, Store, UtensilsCrossed } from "lucide-react";
import type { Profile } from "@/lib/types";

const typeConfig = {
  personal: { icon: User, label: "Personal", path: "/u/" },
  business: { icon: Store, label: "Business", path: "/b/" },
  restaurant: { icon: UtensilsCrossed, label: "Restaurant", path: "/r/" },
};

export default function ProfileCard({ profile }: { profile: Profile }) {
  const config = typeConfig[profile.type];
  const Icon = config.icon;

  return (
    <Link to={`${config.path}${profile.slug}`}>
      <Card className="card-elevated hover:scale-[1.02] transition-transform cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <Badge variant="secondary" className="text-xs">{config.label}</Badge>
          </div>
          <h3 className="font-display font-semibold text-foreground mb-1">{profile.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{profile.description}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            {profile.views ?? 0} views
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
