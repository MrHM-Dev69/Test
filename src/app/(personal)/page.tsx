import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman } from "@/lib/utils";

export const revalidate = 60;

function formatFa(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long" }).format(date);
}

export default async function PersonalHomePage() {
  const [profile, skills, experiences, featuredProjects, services, testimonials] =
    await Promise.all([
      prisma.profile.findFirst(),
      prisma.skill.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], take: 12 }),
      prisma.experience.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }], take: 4 }),
      prisma.portfolioProject.findMany({
        where: { isFeatured: true },
        orderBy: [{ order: "asc" }, { date: "desc" }],
        take: 3,
      }),
      prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 6 }),
      prisma.testimonial.findMany({
        where: { isFeatured: true },
        orderBy: { order: "asc" },
        take: 3,
      }),
    ]);

  const social = (profile?.socialLinks as Record<string, string> | null) ?? {};

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-20 text-center sm:px-6 md:py-28">
          {profile?.availability && (
            <Badge variant="success">{profile.availability}</Badge>
          )}
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
            {profile?.fullName ?? "برند شخصی"}
          </h1>
          <p className="max-w-2xl text-lg text-muted sm:text-xl">
            {profile?.headline ?? "توسعه‌دهنده و طراح دیجیتال"}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/portfolio">مشاهده نمونه‌کارها</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">تماس با من</Link>
            </Button>
          </div>
          {(social.github || social.linkedin || social.twitter || social.instagram || social.telegram) && (
            <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm text-muted">
              {social.github && <a href={social.github} className="hover:text-accent">گیت‌هاب</a>}
              {social.linkedin && <a href={social.linkedin} className="hover:text-accent">لینکدین</a>}
              {social.twitter && <a href={social.twitter} className="hover:text-accent">توییتر</a>}
              {social.instagram && <a href={social.instagram} className="hover:text-accent">اینستاگرام</a>}
              {social.telegram && <a href={social.telegram} className="hover:text-accent">تلگرام</a>}
            </div>
          )}
        </div>
      </section>

      {/* Intro / Bio */}
      {profile?.bio && (
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="mb-4 text-2xl font-bold">درباره من</h2>
          <p className="whitespace-pre-line leading-8 text-muted">{profile.bio}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
            {profile.location && <span>محل: {profile.location}</span>}
            {profile.yearsExperience != null && (
              <span>{profile.yearsExperience} سال سابقه</span>
            )}
          </div>
          <Button asChild variant="link" className="mt-2 px-0">
            <Link href="/about">بیشتر بخوانید ←</Link>
          </Button>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="border-t border-border bg-surface/40 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">مهارت‌ها</h2>
              <Link href="/skills" className="text-sm text-accent hover:underline">
                مشاهده همه
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {skills.map((skill) => (
                <Card key={skill.id} className="p-4 text-center">
                  <p className="font-medium">{skill.name}</p>
                  <p className="mt-1 text-xs text-muted">{skill.category ?? skill.level}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">سوابق کاری</h2>
              <Link href="/experience" className="text-sm text-accent hover:underline">
                مشاهده همه
              </Link>
            </div>
            <ol className="relative border-r-2 border-border pr-6">
              {experiences.map((exp) => (
                <li key={exp.id} className="mb-8">
                  <span className="absolute -right-[9px] mt-1.5 h-4 w-4 rounded-full bg-accent glow-accent" />
                  <p className="text-sm text-muted">
                    {formatFa(exp.startDate)} — {exp.isCurrent ? "اکنون" : exp.endDate ? formatFa(exp.endDate) : ""}
                  </p>
                  <h3 className="text-lg font-semibold">{exp.role}</h3>
                  <p className="text-accent">{exp.company}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section className="border-t border-border py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">نمونه‌کارهای منتخب</h2>
              <Link href="/portfolio" className="text-sm text-accent hover:underline">
                مشاهده همه
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {featuredProjects.map((project) => (
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
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section className="border-t border-border bg-surface/40 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">خدمات</h2>
              <Link href="/services" className="text-sm text-accent hover:underline">
                مشاهده همه
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {services.map((service) => (
                <Link key={service.id} href={`/services/${service.slug}`}>
                  <Card className="h-full transition-colors hover:border-accent/40">
                    <CardTitle>{service.title}</CardTitle>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{service.description}</p>
                    {service.priceFrom != null && (
                      <p className="mt-3 text-sm text-accent">
                        از {formatToman(Number(service.priceFrom))}
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop / Academy previews */}
      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 sm:px-6">
          <Card className="glow-accent text-center">
            <CardHeader>
              <CardTitle>فروشگاه دیجیتال</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              محصولات و قالب‌های دیجیتال برای وب، وردپرس، FiveM، VMP و MTA.
            </CardContent>
            <Button asChild className="mt-4">
              <Link href="/shop">مشاهده فروشگاه</Link>
            </Button>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle>آکادمی آموزشی</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              دوره‌های آموزشی تخصصی برای یادگیری برنامه‌نویسی و توسعه وب.
            </CardContent>
            <Button asChild className="mt-4" variant="secondary">
              <Link href="/academy">مشاهده آکادمی</Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="border-t border-border bg-surface/40 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">نظرات مشتریان</h2>
              <Link href="/testimonials" className="text-sm text-accent hover:underline">
                مشاهده همه
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.id}>
                  <p className="text-sm leading-7 text-muted">&ldquo;{t.content}&rdquo;</p>
                  <p className="mt-4 font-semibold">{t.authorName}</p>
                  {t.authorRole && <p className="text-xs text-muted">{t.authorRole}</p>}
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gradient-accent">آماده همکاری هستید؟</h2>
          <p className="mt-3 text-muted">
            برای شروع پروژه بعدی خود یا ثبت‌نام در دوره‌های آموزشی همین حالا با من در تماس باشید.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/contact">تماس با من</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/shop">مشاهده فروشگاه</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/academy">مشاهده آکادمی</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
