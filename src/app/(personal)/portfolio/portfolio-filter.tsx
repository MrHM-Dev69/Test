"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PortfolioProjectListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string | null;
  technologies: string[];
  images: string[];
}

export function PortfolioFilter({ projects }: { projects: PortfolioProjectListItem[] }) {
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) if (p.category) set.add(p.category);
    return Array.from(set);
  }, [projects]);

  const [active, setActive] = useState<string | null>(null);

  const filtered = active ? projects.filter((p) => p.category === active) : projects;

  return (
    <div>
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={active === null ? "default" : "secondary"}
            onClick={() => setActive(null)}
          >
            همه
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={active === cat ? "default" : "secondary"}
              onClick={() => setActive(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-muted">موردی یافت نشد.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((project) => (
            <Link key={project.id} href={`/portfolio/${project.slug}`}>
              <Card className="h-full transition-colors hover:border-accent/40">
                {project.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.images[0]}
                    alt={project.title}
                    className="mb-4 h-40 w-full rounded-lg object-cover"
                  />
                )}
                <CardTitle>{project.title}</CardTitle>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description}</p>
                {project.technologies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.technologies.slice(0, 4).map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
