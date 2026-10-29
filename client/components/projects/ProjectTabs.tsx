'use client';

import { List, Network } from 'lucide-react';
import { Tabs, type TabItem } from '@/components/common/Tabs';
import type { ProjectDetails } from '@/types/api';
import { EntityList } from './EntityList';
import { ProjectGraph } from './graph/ProjectGraph';

interface ProjectTabsProps {
  project: ProjectDetails;
}

/** Tab ids are part of shareable URLs (`?tab=entities`), so keep them stable. */
export function ProjectTabs({ project }: ProjectTabsProps) {
  const items: TabItem[] = [
    {
      value: 'graph',
      label: 'Graph',
      icon: Network,
      content: <ProjectGraph key={project.id} nodes={project.nodes} edges={project.edges} />,
    },
    {
      value: 'entities',
      label: 'Entities',
      icon: List,
      content: <EntityList nodes={project.nodes} />,
    },
  ];

  return <Tabs items={items} urlParam="tab" label="Project views" />;
}
