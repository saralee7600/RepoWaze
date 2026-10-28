import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { IProject } from '@repowaze/shared';
import { NodeEntity } from '../nodes/node.entity';
import { EdgeEntity } from '../edges/edge.entity';

@Entity('projects')
export class ProjectEntity implements IProject {
  @PrimaryGeneratedColumn({name: 'id'})
  id: number;

  @Column({name: 'repo_url'})
  repoUrl: string;

  @Column({name: 'repo_name'})
  repoName: string;

  @CreateDateColumn({name: 'created_at'})
  createdAt: Date;

  @OneToMany(() => NodeEntity, (node) => node.project)
  nodes: NodeEntity[];

  @OneToMany(() => EdgeEntity, (edge) => edge.project)
  edges: EdgeEntity[];
}
