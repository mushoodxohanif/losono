import { LogOutIcon } from "lucide-react";
import { signOut } from "@/auth";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function SignOutDropdownItem() {
  return (
    <form
      className="w-full"
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <DropdownMenuItem asChild variant="destructive">
        <button type="submit" className="w-full">
          <LogOutIcon />
          Log out
        </button>
      </DropdownMenuItem>
    </form>
  );
}
