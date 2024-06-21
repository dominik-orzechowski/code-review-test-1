import {getPreviousDay} from "@/components/DatePicker/DatePicker.utils";

export const Text  = () => {
    const name = 'Mariusz';
    const surname = "Pudzian";
    console.log(getPreviousDay())
    return <>Cześć {name} {surname}</>
}