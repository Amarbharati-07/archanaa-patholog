import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  FlaskConical, 
  Calendar, 
  Settings,
  FilePlus,
  LogOut,
  Megaphone,
  MessageSquare,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Patients", url: "/admin/patients", icon: Users },
  { title: "Create Report", url: "/admin/create-report", icon: FilePlus },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Tests", url: "/admin/tests", icon: FlaskConical },
  { title: "Bookings", url: "/admin/bookings", icon: Calendar },
  { title: "Advertisements", url: "/admin/advertisements", icon: Megaphone },
  { title: "Reviews", url: "/admin/reviews", icon: MessageSquare },
];

export function AdminSidebar() {
  const [location] = useLocation();
  const { admin, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/admin") return location === "/admin";
    return location.startsWith(path);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/admin" className="flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          <span className="font-semibold text-sm">Archana Pathology</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    data-testid={`link-admin-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            Logged in as: <span className="font-medium text-foreground">{admin?.name || "Admin"}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2"
            onClick={logout}
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
