"use client";

import * as React from "react";
import {
  Bell,
  Boxes,
  Check,
  Clock,
  Folder,
  Grid,
  PlayCircle,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip, Tag } from "@/components/ui/status-chip";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  Avatar,
  FilterChip,
  PhotoSlot,
  ProgressBar,
  SegmentedControl,
} from "@/components/ui/primitives";

/**
 * The design-system tile from the mood board, built entirely from styles/tokens.css.
 * Every element here carries a data-ui attribute, so scripts/spec-check.mjs can
 * verify the rendered values rather than trusting this file.
 */

const PALETTE = [
  ["Primary", "var(--primary)"],
  ["Primary tint", "var(--primary-tint)"],
  ["CTA black", "var(--cta-black)"],
  ["Foreground", "var(--fg)"],
  ["Muted", "var(--fg-muted)"],
  ["Background", "var(--bg)"],
  ["Surface", "var(--surface)"],
  ["Surface 2", "var(--surface-2)"],
  ["Border", "var(--border)"],
  ["Dark", "var(--dark)"],
] as const;

const CHIPS = [
  ["progress", "In Progress"],
  ["review", "In Review"],
  ["accepted", "Accepted"],
  ["rejected", "Rejected"],
  ["paid", "Paid"],
  ["pending", "Not started"],
  ["appealed", "Appealed"],
] as const;

export default function ComponentGalleryPage() {
  const [chip, setChip] = React.useState("All");

  return (
    <main className="mx-auto w-full max-w-[1280px] px-8 py-8">
      <header className="mb-8">
        <h1 className="text-[40px] leading-[1.1]">Design system</h1>
        <p className="mt-2 text-[16px] text-[var(--fg-muted)]">
          Every value below comes from <code className="machine">styles/tokens.css</code>. Nothing is
          hard-coded here.
        </p>
      </header>

      <div className="grid min-w-0 grid-cols-1 gap-6">
        {/* palette */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Colour palette</CardTitle>
              <CardDescription>One violet accent; everything else is surface and text.</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {PALETTE.map(([name, value]) => (
                <div key={name} className="flex flex-col gap-2">
                  <div
                    className="h-14 w-full rounded-[12px] border border-[var(--border)]"
                    style={{ background: value }}
                  />
                  <span className="text-[13px] font-medium text-[var(--fg)]">{name}</span>
                  <span className="machine text-[12px] text-[var(--fg-muted)]">{value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* buttons */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>40px on app surfaces, 44px for the black marketing CTA.</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="flex flex-wrap items-center gap-3">
            <Button>Primary button</Button>
            <Button variant="black">
              Get started
              <PlayCircle className="size-4" />
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Sign in</Button>
            <Button variant="quiet">Quiet</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small</Button>
            <Button size="icon">
              <Bell />
            </Button>
          </CardBody>
        </Card>

        {/* chips and tags */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Status chips and tags</CardTitle>
              <CardDescription>
                Always icon plus text, never colour alone. Paid is teal because violet is the brand.
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody className="flex flex-wrap items-center gap-2.5">
            {CHIPS.map(([tone, label]) => (
              <StatusChip key={tone} tone={tone}>
                {label}
              </StatusChip>
            ))}
            <Tag>Video Annotation</Tag>
            <Tag tone="neutral">Intermediate</Tag>
          </CardBody>
        </Card>

        {/* kpi */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>KPI row</CardTitle>
              <CardDescription>
                Four equal columns. The sparkline and delta appear only when a real series is
                supplied — compare the two cards below.
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <div data-ui="kpi-row" className="grid grid-cols-2 gap-5 xl:grid-cols-4">
              <KpiCard label="Accepted" value="214" tone="primary" />
              <KpiCard label="In review" value="37" hint="Across all jobs" />
              <KpiCard
                label="Confirmed spend"
                value="70.00"
                tone="positive"
                series={{ points: [40, 48, 52, 61, 70], deltaPct: 12.4 }}
                hint="Only shown with a real series"
              />
              <KpiCard label="Budget left" value="90.00" />
            </div>
          </CardBody>
        </Card>

        {/* controls */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Controls</CardTitle>
              <CardDescription>Inputs, filter chips, segmented control, progress.</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Search jobs" aria-label="Search jobs demo" />
              <Input defaultValue="0.50 test USDC" aria-label="Amount demo" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {["All", "Image", "Video"].map((f) => (
                <FilterChip key={f} active={chip === f} onClick={() => setChip(f)}>
                  {f}
                </FilterChip>
              ))}
            </div>

            <SegmentedControl
              value="annotation"
              onValueChange={setChip}
              options={[
                { value: "annotation", label: "Annotation" },
                { value: "instructions", label: "Instructions" },
              ]}
            />

            <div className="flex max-w-sm flex-col gap-3">
              <ProgressBar value={72} label="Example progress 72%" />
              <ProgressBar value={100} complete label="Example progress complete" />
            </div>

            <div className="flex items-center gap-4">
              <Avatar name="PhysicalData Demo" />
              <Avatar name="Contributor 4F2A" size={28} />
              <PhotoSlot alt="Hero robot arm" className="h-16 w-24" />
            </div>
          </CardBody>
        </Card>

        {/* navigation icons */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Icons</CardTitle>
              <CardDescription>One library, one stroke weight, near-black on light surfaces.</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="flex flex-wrap items-center gap-5 text-[var(--fg)]">
            {[Grid, Folder, Boxes, Users, Wallet, Settings, Bell, Clock, Check].map((Icon, i) => (
              <Icon key={i} className="size-6" />
            ))}
          </CardBody>
        </Card>

        {/* type scale */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Satoshi for headings and figures, Inter for everything else.
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            {[
              ["Hero", "var(--t-hero)", "1.05", "700"],
              ["H2", "var(--t-h2)", "1.1", "700"],
              ["H3", "var(--t-h3)", "1.33", "700"],
              ["Lead", "var(--t-lead)", "1.55", "400"],
              ["Body", "var(--t-body)", "1.5", "400"],
              ["UI", "var(--t-ui)", "1.43", "500"],
              ["Caption", "var(--t-caption)", "1.33", "400"],
            ].map(([name, size, lh, weight]) => (
              <div key={name} className="flex items-baseline gap-5 border-b border-[var(--border)] pb-4 last:border-0">
                <span className="w-20 shrink-0 text-[13px] text-[var(--fg-muted)]">{name}</span>
                <span
                  className="font-display min-w-0 flex-1 truncate"
                  style={{ fontSize: size, lineHeight: lh, fontWeight: weight }}
                >
                  Robot footage, labelled and checked
                </span>
                <span className="machine ml-auto shrink-0 text-[12px] text-[var(--fg-muted)]">
                  {String(size).replace("var(--", "").replace(")", "")} / {String(lh)}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </main>
  );
}