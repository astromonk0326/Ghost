import type {Meta, StoryObj} from '@storybook/react';
import {useArgs} from '@storybook/preview-api';

import Page, {CustomGlobalAction} from './Page';
import {Tab} from '../TabView';
import ViewContainer from './ViewContainer';

import {testColumns, testRows} from '../table/DynamicTable.stories';
import DynamicTable from '../table/DynamicTable';
import Hint from '../Hint';

const meta = {
    title: 'Global / Layout / Page',
    component: Page,
    tags: ['autodocs'],
    render: function Component(args) {
        const [, updateArgs] = useArgs();

        return <Page {...args}
            onTabChange={(tab) => {
                updateArgs({selectedTab: tab});
                args.onTabChange?.(tab);
            }}
        />;
    }
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof Page>;

const dummyContent = <div className='m-auto max-w-[800px] p-5 text-center'>Placeholder content</div>;

const customGlobalActions: CustomGlobalAction[] = [
    {
        iconName: 'heart',
        onClick: () => {
            alert('Clicked on custom action');
        }
    }
];

const pageTabs: Tab[] = [
    {
        id: 'steph',
        title: 'Steph Curry'
    },
    {
        id: 'klay',
        title: 'Klay Thompson'
    }
];

export const Default: Story = {
    args: {
        pageTabs: pageTabs,
        children: dummyContent
    }
};

export const WithHamburger: Story = {
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        children: dummyContent
    }
};

export const WithGlobalActions: Story = {
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        showGlobalActions: true,
        children: dummyContent
    }
};

export const CustomGlobalActions: Story = {
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        showGlobalActions: true,
        children: dummyContent,
        customGlobalActions: customGlobalActions
    }
};

const simpleList = <ViewContainer
    title='List page'
    type='page'
    contentFullBleed
>
    <DynamicTable
        columns={testColumns}
        footer={<Hint>Sticky footer</Hint>}
        rows={testRows(40)}
        stickyFooter
        stickyHeader
        usePagePaddingsForSticky
    />
</ViewContainer>;

export const ExampleSimpleList: Story = {
    name: 'Example: Simple List',
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        showGlobalActions: true,
        children: simpleList
    }
};