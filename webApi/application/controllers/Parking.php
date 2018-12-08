<?php

class Parking extends CI_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('m_park_info');
    }

    public function process_card($card_id)
    {
        $info = $this->m_park_info->get_card_info_by_id($card_id);
        if ($info) {
            // Check Flag
            $flag = $info['flag'];
            //EXIT
            if ($flag == 1) {
                // Check member
                $member = $info['is_member'];
                if($member == 1){
                    $this->m_park_info->set_flag_by_id($card_id, 0);
                    $info = $this->m_park_info->get_card_info_by_id($card_id);
                }
                else{
                    $this->m_park_info->set_flag_by_id($card_id, 0);
                    $this->update_card_info($card_id,null);
                    $info = $this->m_park_info->get_card_info_by_id($card_id);
                }

                return true;
            } //ENTRY (Flag =0)
            else {
                echo "---ENTRY CAR---<br>";
                // Check member
                $member = $info['is_member'];
                if ($member == 1) {
                    echo $this->m_park_info->get_card_info_by_id($card_id);
                    echo "---Your flag now: ";
                    echo $info['flag'];
                } else {
                    echo "---Welcome Guest---<br>";
                    echo "---Input car_code with card_id: ";
                    echo $card_id;
                    $this->m_park_info->set_flag_by_id($card_id, 1);
                    echo "Please come in!<br>";
                    $info = $this->m_park_info->get_card_info_by_id($card_id);
                    echo "<br>---Your flag now: ";
                    echo $info['flag'];
                }
            }
        } else {
            echo "Not exist card";
        }
    }

    public function update_card_info($card_id, $car_code)
    {
        $this->m_park_info->set_car_code_by_condition($card_id,$car_code);
        var_dump($this->m_park_info->get_card_info_by_id($card_id));

    }

    public function get_parking_information(){
        $temp= $this->m_park_info->get_car_info();
        echo "CountFlag: ";
        echo $temp['countflag'];
    }
}