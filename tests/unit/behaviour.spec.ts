import { describe, expect, it } from 'vitest';
import { add, getYear, set } from 'date-fns';

import { flushPromises, mount } from '@vue/test-utils';

import VueDatePicker from '@/VueDatePicker.vue';

import { resetDateTime } from '@/utils/date-utils';

import type { AllPropsType } from '@/props';

const openMenu = async (props: Partial<AllPropsType>) => {
    const dp = mount(VueDatePicker, { props });

    dp.vm.openMenu();
    await flushPromises();

    await dp.vm.$nextTick();
    return dp;
};

describe('It should validate various picker scenarios', () => {
    it('Should dynamically disable times', async () => {
        const modelValue = set(new Date(), { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 });
        const disabledTimes = [
            { hours: 14, minutes: 15 },
            { hours: 14, minutes: 20 },
            { hours: 15, minutes: '*' },
        ];
        const dp = await openMenu({ modelValue, disabledTimes });

        const setHours = async (val: number) => {
            await dp.find(`[data-test="open-time-picker-btn"]`).trigger('click');

            await dp.find(`[data-test="hours-toggle-overlay-btn"]`).trigger('click');
            await dp.find(`[data-test="${val}"]`).trigger('click');
        };

        await setHours(14);

        await dp.find(`[data-test="minutes-toggle-overlay-btn"]`).trigger('click');

        await dp.vm.$nextTick();
        const el = dp.find(`[data-test="15"]`);

        expect(el.attributes()['aria-disabled']).toEqual('true');

        for (let i = 0; i < 20; i++) {
            await dp.find(`[data-test="minutes-time-inc-btn"]`).trigger('click');
        }

        const minutesOverlayBtn = dp.find(`[data-test="minutes-toggle-overlay-btn"]`);
        expect(minutesOverlayBtn.classes()).toContain('dp--time-invalid');

        await setHours(15);
        const hoursOverlayBtn = dp.find(`[data-test="hours-toggle-overlay-btn"]`);
        expect(hoursOverlayBtn.classes()).toContain('dp--time-invalid');
        dp.unmount();
    });

    it('Should auto apply date in the flow mode (#465)', async () => {
        const dp = await openMenu({ flow: ['month', 'year', 'calendar'], autoApply: true });
        const date = add(new Date(), { months: 1, years: 1 });

        const year = getYear(date);

        const month = new Intl.DateTimeFormat('en-Us', { month: 'short', timeZone: 'UTC' }).format(date);
        const monthName = month.charAt(0).toUpperCase() + month.substring(1);

        await dp.find(`[data-test="${monthName}"]`).trigger('click');
        await dp.find(`[data-test="${year}"]`).trigger('click');
        const dateVal = resetDateTime(date);
        await dp.find(`[data-test="${dateVal}"]`).trigger('click');
        const emitted = dp.emitted();
        expect(emitted).toHaveProperty('update:model-value', [[set(date, { seconds: 0, milliseconds: 0 })]]);
    });
});