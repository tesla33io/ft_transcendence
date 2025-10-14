import { UserService } from '../game/userService';
import type { TournamentStatistics} from '../game/userService';


export interface TournamentStatsComponentOptions {
    container: HTMLElement;
    userId?: number; // If not provided, gets current user stats
    showTitle?: boolean; // Whether to show title
    onError?: (error: string) => void; // Error callback
}

export class TournamentStatsComponent {
    private container: HTMLElement;
    private options: TournamentStatsComponentOptions;
    private data: TournamentStatistics | null = null;
    private loading = false;

    constructor(options: TournamentStatsComponentOptions) {
        this.container = options.container;
        this.options = {
            showTitle: true,
            ...options
        };
        
        this.init();
    }

    private async init() {
        await this.loadData();
        this.render();
    }

    private async loadData() {
        this.loading = true;
        this.renderLoading();

        try {
            if (this.options.userId) {
                this.data = await UserService.getUserTournamentStats(this.options.userId);
            } else {
                this.data = await UserService.getCurrentUserTournamentStats();
            }
        } catch (error) {
            console.error('Failed to load tournament statistics:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load tournament statistics';
            
            if (this.options.onError) {
                this.options.onError(errorMessage);
            } else {
                this.renderError(errorMessage);
            }
            return;
        } finally {
            this.loading = false;
        }
    }

    private renderLoading() {
        this.container.innerHTML = '';
        this.container.className = 'tournament-stats-component sunken-panel';
        this.container.style.cssText = `
            padding: 8px;
            background-color: #e0e0e0;
            text-align: center;
        `;

        const loading = document.createElement('div');
        loading.style.cssText = `
            color: #666;
            font-size: 11px;
        `;
        loading.textContent = '⏳ Loading tournament stats...';
        
        this.container.appendChild(loading);
    }

    private renderError(errorMessage: string) {
        this.container.innerHTML = '';
        this.container.className = 'tournament-stats-component sunken-panel';
        this.container.style.cssText = `
            padding: 8px;
            background-color: #e0e0e0;
            text-align: center;
        `;

        const error = document.createElement('div');
        error.style.cssText = `
            color: #cc0000;
            font-size: 10px;
        `;
        error.textContent = `❌ ${errorMessage}`;
        
        this.container.appendChild(error);
    }

    private render() {
        if (!this.data || this.loading) return;

        this.container.innerHTML = '';
        this.container.className = 'tournament-stats-component sunken-panel';
        this.container.style.cssText = `
            padding: 8px;
            background-color: #e0e0e0;
        `;

        // Title (optional)
        if (this.options.showTitle) {
            const title = document.createElement('h4');
            title.textContent = 'Tournament Stats';
            title.style.cssText = `
                margin: 0 0 8px 0;
                font-size: 12px;
                font-weight: bold;
                text-align: center;
                color: #000080;
            `;
            this.container.appendChild(title);
        }

        // Stats in a simple row layout
        const statsRow = document.createElement('div');
        statsRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            gap: 8px;
            font-size: 10px;
        `;

        const stats = [
            { label: 'Wins', value: this.data.tournamentWins, color: '#008000' },
            { label: 'Participated', value: this.data.tournamentsParticipated, color: '#000080' },
            { label: 'Win Rate', value: `${this.data.winLossPercentage}%`, color: '#800080' }
        ];

        stats.forEach(stat => {
            const statDiv = document.createElement('div');
            statDiv.style.cssText = `
                text-align: center;
                padding: 4px;
                background-color: #f0f0f0;
                border: 1px inset #c0c0c0;
                flex: 1;
            `;

            const value = document.createElement('div');
            value.textContent = stat.value.toString();
            value.style.cssText = `
                font-weight: bold;
                color: ${stat.color};
                margin-bottom: 2px;
            `;

            const label = document.createElement('div');
            label.textContent = stat.label;
            label.style.color = '#404040';

            statDiv.appendChild(value);
            statDiv.appendChild(label);
            statsRow.appendChild(statDiv);
        });

        this.container.appendChild(statsRow);
    }

    // Public method to refresh data
    async refresh() {
        await this.loadData();
        this.render();
    }

    // Public method to get current data
    getData(): TournamentStatistics | null {
        return this.data;
    }
}